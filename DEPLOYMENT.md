# 🚀 GitHub Pages Deployment Instructions

This guide will help you deploy the Budget Planner application to GitHub Pages.

## 📋 Prerequisites

- GitHub account
- Git installed on your local machine
- Basic understanding of Git commands

## 🔧 Setup Instructions

### 1. Fork or Clone Repository

#### Option A: Fork (Recommended for your own copy)
1. Visit the repository: https://github.com/bbogdanov/simple-budget
2. Click the "Fork" button in the top-right corner
3. Clone your forked repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/simple-budget.git
   cd simple-budget
   ```

#### Option B: Clone and Push to New Repository
1. Clone the original repository:
   ```bash
   git clone https://github.com/bbogdanov/simple-budget.git
   cd simple-budget
   ```
2. Remove the original remote and add your own:
   ```bash
   git remote remove origin
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   ```

### 2. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Scroll down to **Pages** section (left sidebar)
4. Under **Source**, select **"GitHub Actions"**
5. The workflow will automatically deploy on the next push

### 3. Verify Deployment

1. Push any change to trigger deployment:
   ```bash
   git add .
   git commit -m "Enable GitHub Pages deployment"
   git push origin main
   ```

2. Check the **Actions** tab to monitor deployment progress
3. Once complete, your site will be available at:
   ```
   https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
   ```

## 🔄 Automatic Deployment

The included GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically:

- **Trigger**: On every push to the `main` branch
- **Build**: Process the static files using Jekyll
- **Deploy**: Update the live site with new changes
- **Monitor**: Show deployment status in the Actions tab

## 🛠️ Customization

### Update Repository URL
Edit the README.md file to update the live demo link:
```markdown
## 🚀 Live Demo
Visit the live application: [Budget Planner](https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/)
```

### Custom Domain (Optional)
To use a custom domain:

1. Create a `CNAME` file in the repository root:
   ```
   your-domain.com
   ```
2. Configure DNS settings with your domain provider
3. Update the `_config.yml` file:
   ```yaml
   url: "https://your-domain.com"
   ```

### Site Configuration
Modify `_config.yml` to customize:
```yaml
title: Your Budget Planner
description: Your custom description
url: "https://YOUR_USERNAME.github.io"
baseurl: "/YOUR_REPO_NAME"
```

## 🔍 Troubleshooting

### Deployment Fails
- Check the **Actions** tab for error details
- Ensure all required files are present
- Verify the workflow file syntax

### Site Not Loading
- Wait 5-10 minutes after first deployment
- Check that Pages is enabled in repository settings
- Verify the correct URL format

### Changes Not Reflecting
- Ensure changes are pushed to the `main` branch
- Check Actions tab for deployment status
- Clear browser cache or try incognito mode

## 📊 Monitoring

### Deployment Status
- **Actions Tab**: Real-time deployment progress
- **Environments**: Deployment history and status
- **Pages Settings**: Current deployment source and URL

### Site Analytics (Optional)
Add Google Analytics by including the tracking code in `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR_TRACKING_ID');
</script>
```

## 🎉 Success!

Your Budget Planner is now deployed and accessible worldwide. Share the URL with others and enjoy your fully-featured budget tracking application!

## 📞 Need Help?

- Check [GitHub Pages Documentation](https://docs.github.com/en/pages)
- Open an issue in the repository
- Review the GitHub Actions logs for specific error messages