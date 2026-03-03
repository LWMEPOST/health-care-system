const http = require('http');
const url = require('url');
const { createClient } = require('@supabase/supabase-js');
try { require('dotenv').config(); } catch (_) {}

const PORT = Number(process.env.MCP_PORT || 54325);
const HOST = process.env.MCP_HOST || '0.0.0.0';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const RESOLVED_SUPABASE_URL = SUPABASE_URL.includes('/mcp')
  ? SUPABASE_URL.split('/mcp')[0]
  : SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(RESOLVED_SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: true, persistSession: false }
});

const send = (res, status, data, headers = {}) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...headers
  });
  res.end(JSON.stringify(data));
};

const notFound = (res) => send(res, 404, { ok: false, error: 'Not Found' });
const badRequest = (res, message) => send(res, 400, { ok: false, error: message || 'Bad Request' });
const serverError = (res, message) => send(res, 500, { ok: false, error: message || 'Internal Server Error' });

const parseBody = async (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
};

const buildQuery = (table, opts = {}) => {
  let query = supabase.from(table).select(opts.select || '*');
  const { filters = {}, orderBy, ascending = true, limit } = opts;
  Object.entries(filters).forEach(([k, v]) => {
    if (Array.isArray(v)) query = query.in(k, v);
    else if (v === null) query = query.is(k, null);
    else query = query.eq(k, v);
  });
  if (orderBy) query = query.order(orderBy, { ascending });
  if (limit) query = query.limit(limit);
  return query;
};

const handle = async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname || '/';

  if (req.method === 'OPTIONS') {
    return send(res, 200, { ok: true });
  }

  if (req.method === 'GET' && pathname === '/mcp') {
    const featureParam = parsed.query.features || '';
    const features = String(featureParam).split(',').filter(Boolean);
    return send(res, 200, {
      ok: true,
      name: 'supabase-mcp',
      version: '0.1.0',
      capabilities: features.length ? features : ['database', 'docs', 'debugging', 'development'],
      supabaseUrl: RESOLVED_SUPABASE_URL
    });
  }

  if (req.method === 'GET' && pathname === '/mcp/health') {
    try {
      const { error } = await supabase.from('users').select('id').limit(1);
      return send(res, 200, { ok: true, db: error ? 'reachable-with-error' : 'ok' });
    } catch (e) {
      return send(res, 200, { ok: true, db: 'unknown' });
    }
  }

  if (req.method === 'POST' && pathname === '/mcp/db/select') {
    try {
      const body = await parseBody(req);
      const { table, select, filters, orderBy, ascending, limit } = body || {};
      if (!table) return badRequest(res, 'table required');
      const { data, error } = await buildQuery(table, { select, filters, orderBy, ascending, limit });
      if (error) return send(res, 400, { ok: false, error: error.message });
      return send(res, 200, { ok: true, data });
    } catch (e) { return serverError(res, e.message); }
  }

  if (req.method === 'POST' && pathname === '/mcp/db/insert') {
    try {
      const body = await parseBody(req);
      const { table, data } = body || {};
      if (!table || !data) return badRequest(res, 'table and data required');
      const { data: result, error } = await supabase.from(table).insert(data).select().single();
      if (error) return send(res, 400, { ok: false, error: error.message });
      return send(res, 200, { ok: true, data: result });
    } catch (e) { return serverError(res, e.message); }
  }

  if (req.method === 'POST' && pathname === '/mcp/db/update') {
    try {
      const body = await parseBody(req);
      const { table, match, data } = body || {};
      if (!table || !match || !data) return badRequest(res, 'table, match and data required');
      let q = supabase.from(table).update(data);
      Object.entries(match).forEach(([k, v]) => { q = q.eq(k, v); });
      const { data: result, error } = await q.select().single();
      if (error) return send(res, 400, { ok: false, error: error.message });
      return send(res, 200, { ok: true, data: result });
    } catch (e) { return serverError(res, e.message); }
  }

  if (req.method === 'POST' && pathname === '/mcp/db/delete') {
    try {
      const body = await parseBody(req);
      const { table, match } = body || {};
      if (!table || !match) return badRequest(res, 'table and match required');
      let q = supabase.from(table).delete();
      Object.entries(match).forEach(([k, v]) => { q = q.eq(k, v); });
      const { error } = await q;
      if (error) return send(res, 400, { ok: false, error: error.message });
      return send(res, 200, { ok: true });
    } catch (e) { return serverError(res, e.message); }
  }

  return notFound(res);
};

http.createServer(handle).listen(PORT, HOST, () => {
  console.log(`[mcp] supabase-mcp server listening on http://${HOST}:${PORT}/mcp`);
});
