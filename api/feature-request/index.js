module.exports = async function (context, req) {
    const title = req.body?.title;
    const description = req.body?.description;
    const submitter = req.body?.name || 'Anonymous';
    
    if (!title) {
        context.res = {
            status: 400,
            body: { error: 'Title is required' }
        };
        return;
    }
    
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
        context.res = {
            status: 500,
            body: { error: 'Server configuration error' }
        };
        return;
    }
    
    const issueBody = `## Feature Request

**Submitted by:** ${submitter}

**Description:**
${description || 'No description provided.'}

---
*Submitted via the website feature request form* 🦾`;

    try {
        const response = await fetch('https://api.github.com/repos/mineflowprocess/built-by-bot/issues', {
            method: 'POST',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'Azure-Function'
            },
            body: JSON.stringify({
                title: `[Feature Request] ${title}`,
                body: issueBody,
                labels: ['feature-request']
            })
        });
        
        if (!response.ok) {
            const error = await response.text();
            context.res = {
                status: 500,
                body: { error: 'Failed to create issue', details: error }
            };
            return;
        }
        
        const issue = await response.json();
        context.res = {
            status: 200,
            body: { 
                success: true, 
                issueNumber: issue.number,
                issueUrl: issue.html_url
            }
        };
    } catch (err) {
        context.res = {
            status: 500,
            body: { error: 'Failed to create issue', details: err.message }
        };
    }
};
