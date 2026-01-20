
export async function fetchPublicGitHubData(username: string) {
    const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ResumeApp-Ingestion/1.0'
    };

    // Server-side token strategy
    const token = process.env.GITHUB_TOKEN;
    if (token) {
        headers['Authorization'] = `token ${token}`;
    } else {
        console.warn("No GITHUB_TOKEN found. Rate limits will be low.");
    }

    // 1. User Profile
    const profileRes = await fetch(`https://api.github.com/users/${username}`, { headers });
    if (!profileRes.ok) return null;
    const profile = await profileRes.json();

    // 2. Repos (Top 6 sorted by updated)
    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=pushed&per_page=6&type=owner`, { headers });
    const repos = reposRes.ok ? await reposRes.json() : [];

    // 3. For top 2 repos, fetch README content (raw)
    const reposWithDetails = await Promise.all(repos.slice(0, 3).map(async (repo: any) => {
        let readmeContent = "";
        try {
            const readmeRes = await fetch(`https://api.github.com/repos/${username}/${repo.name}/readme`, { headers });
            if (readmeRes.ok) {
                const readmeData = await readmeRes.json();
                // GitHub API returns content in Base64
                readmeContent = atob(readmeData.content);
            }
        } catch (e) {
            console.warn(`Failed to fetch README for ${repo.name}`);
        }

        // Try package.json for Node projects to infer skills clearly
        let packageJson = null;
        try {
            const pkgRes = await fetch(`https://api.github.com/repos/${username}/${repo.name}/contents/package.json`, { headers });
            if (pkgRes.ok) {
                const pkgData = await pkgRes.json();
                const jsonStr = atob(pkgData.content);
                packageJson = JSON.parse(jsonStr);
            }
        } catch (e) { /* ignore */ }

        return {
            name: repo.name,
            description: repo.description,
            html_url: repo.html_url,
            language: repo.language,
            stargazers_count: repo.stargazers_count,
            updated_at: repo.updated_at,
            readme: readmeContent ? readmeContent.slice(0, 2000) : "", // Truncate to save tokens
            packageDependencies: packageJson ? { ...packageJson.dependencies, ...packageJson.devDependencies } : null
        };
    }));

    return {
        profile: {
            login: profile.login,
            name: profile.name,
            bio: profile.bio,
            location: profile.location,
            blog: profile.blog,
            html_url: profile.html_url,
            public_repos: profile.public_repos,
        },
        repos: reposWithDetails
    };
}
