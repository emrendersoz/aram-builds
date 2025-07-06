import buildsData from "./data/builds.json";
import skillsData from "./data/skills.json";
import statsData from "./data/stats.json";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function handleCORS(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  return null;
}

async function handleRequest(request) {
  const corsResponse = handleCORS(request);
  if (corsResponse) return corsResponse;

  const url = new URL(request.url);
  const path = url.pathname;

  const headers = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    switch (path) {
      case "/":
        return new Response(
          JSON.stringify({
            message: "LoL Build Aggregator API",
            endpoints: ["/api/builds", "/api/skills", "/api/stats"],
            timestamp: new Date().toISOString(),
          }),
          { headers }
        );

      case "/api/builds":
        return new Response(JSON.stringify(buildsData), { headers });

      case "/api/skills":
        return new Response(JSON.stringify(skillsData), { headers });

      case "/api/stats":
        return new Response(JSON.stringify(statsData), { headers });

      case "/health":
        return new Response(
          JSON.stringify({
            status: "OK",
            timestamp: new Date().toISOString(),
          }),
          { headers }
        );

      default:
        return new Response(
          JSON.stringify({
            error: "Not Found",
            path: path,
          }),
          {
            status: 404,
            headers,
          }
        );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: error.message,
      }),
      {
        status: 500,
        headers,
      }
    );
  }
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request);
  },
};
