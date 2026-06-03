const GITHUB_API_URL = 'https://api.github.com/repos/ericlevicky/batting-order-generator/issues';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.GITHUB_ISSUES_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  try {
    const response = await fetch(GITHUB_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
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
      return res.status(response.status).json({ error: 'Failed to create issue', details: errorData.message });
    }

    const issue = await response.json();
    return res.status(201).json({ success: true, issueNumber: issue.number, url: issue.html_url });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create issue' });
  }
}
