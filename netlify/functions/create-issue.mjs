const GITHUB_API_URL = 'https://api.github.com/repos/ericlevicky/batting-order-generator/issues';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = process.env.GITHUB_ISSUES_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { title, description } = body;

  if (!title || !description) {
    return new Response(JSON.stringify({ error: 'Title and description are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const response = await fetch(GITHUB_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'batting-order-generator',
      },
      body: JSON.stringify({
        title,
        body: description,
        labels: ['enhancement'],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return new Response(JSON.stringify({ error: 'Failed to create issue', details: errorData.message }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const issue = await response.json();
    return new Response(JSON.stringify({ success: true, issueNumber: issue.number, url: issue.html_url }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create issue' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config = {
  path: '/.netlify/functions/create-issue',
};
