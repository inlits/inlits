import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.39.3'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60 // 60 requests per minute
const ipRequestCounts = new Map<string, { count: number, resetTime: number }>()

// Security audit logging
const logSecurityEvent = async (event: string, details: any, supabase: any) => {
  try {
    await supabase
      .from('security_logs')
      .insert({
        event,
        details,
        ip_address: details.ip || 'unknown',
        user_id: details.userId || null,
        timestamp: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown'
    
    // Check rate limit
    const now = Date.now()
    const requestData = ipRequestCounts.get(clientIp) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW }
    
    // Reset count if window has passed
    if (now > requestData.resetTime) {
      requestData.count = 0
      requestData.resetTime = now + RATE_LIMIT_WINDOW
    }
    
    requestData.count++
    ipRequestCounts.set(clientIp, requestData)
    
    // Enforce rate limit
    if (requestData.count > MAX_REQUESTS_PER_WINDOW) {
      return new Response(
        JSON.stringify({ error: 'Too many requests', code: 'rate_limit_exceeded' }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': `${Math.ceil((requestData.resetTime - now) / 1000)}`
          } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Extract authorization token
    const authHeader = req.headers.get('Authorization')
    let userId = null
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (!error && user) {
        userId = user.id
      }
    }
    
    // Parse request body
    const contentType = req.headers.get('content-type') || ''
    let reqBody = {}
    
    if (contentType.includes('application/json')) {
      reqBody = await req.json()
    }
    
    // Log request for security auditing
    await logSecurityEvent('api_request', {
      method: req.method,
      path: new URL(req.url).pathname,
      ip: clientIp,
      userId,
      userAgent: req.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    }, supabase)
    
    // Process the request based on path and method
    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()
    
    if (path === 'health') {
      return new Response(
        JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Example of a protected endpoint
    if (path === 'protected' && !userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', code: 'unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Default response
    return new Response(
      JSON.stringify({ 
        message: 'API Gateway functioning properly',
        path,
        method: req.method,
        authenticated: !!userId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error processing request:', error)
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'internal_error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})