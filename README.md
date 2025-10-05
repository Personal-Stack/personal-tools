# Personal Tools Suite 🛠️

A comprehensive collection of personal productivity tools featuring financial management, advanced analytics, and a complete design system. Built with modern web technologies to enhance personal workflow and data analysis.

## ☕ Support This Project

If you find these tools useful and want to support continued development:

[![Buy Me A Coffee](https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png)](https://www.buymeacoffee.com/personalstack)

Your support helps maintain and improve these open-source personal productivity tools! 🙏
Personal Tools Suite �️

A comprehensive collection of personal productivity tools featuring financial management, advanced analytics, and a complete design system. Built with modern web technologies to enhance personal workflow and data analysis.

## 🌟 Personal Tools Collection

### 💰 Financial Management (Budget Planner)
- **💱 Multi-Currency Support**: Track budgets in 8 different currencies with real-time conversion
- **📈 Investment Planning**: Set investment allocations with flexible frequency options
- **📊 Dynamic Visualization**: Create custom charts filtered by tags, frequencies, or combinations
- **📝 Change History**: Complete audit trail with manual comments and import/export capabilities
- **📥📤 Data Import/Export**: JSON-based data exchange with comprehensive validation
- **⚡ Real-time Updates**: Immediate calculations and chart updates

### 📊 Financial Analytics (Revolut Dashboard)  
- **� Advanced Financial Analytics**: Spending volatility analysis, drawdown risk assessment, and trend analysis
- **⚠️ Anomaly Detection**: AI-powered identification of unusual transactions and spending patterns
- **📈 Interactive Charts**: Dynamic visualizations with theme-aware Chart.js integration
- **🎯 Personalized Insights**: Smart recommendations based on spending behavior analysis
- **📋 Category Risk Assessment**: Comprehensive risk scoring for different spending categories
- **📄 Data Processing**: CSV import with advanced filtering and exclusion patterns

### 🎨 UI Framework (Design System)
- **🧩 Component Library**: Complete set of reusable UI components (buttons, cards, forms, navigation)
- **🌗 Theme Management**: Advanced light/dark theme system with seamless switching
- **📱 Responsive Framework**: Mobile-first design with consistent spacing and typography
- **🎯 Accessibility**: WCAG-compliant components with proper contrast ratios and focus management
- **📐 Design Tokens**: Standardized colors, spacing, typography, and layout systems

### 🍅 Pomodoro Timer
- **🍅 Focused Work Sessions**: Customizable Pomodoro intervals with enforced break
- **📊 Advanced Statistics**: Visualize focus trends and session statistics with interactive charts
- **🔔 Notifications**: Configurable sound and visual alerts for session transition
- **🔒 Lock Screen Mode**: Prevents skipping breaks to ensure productivity

## 🚀 Live Demo

Experience the personal tools suite: [Personal Tools Collection](https://Personal-Stack.github.io/personal-tools/)

### 📱 Application Access
- **🏠 Main Hub**: [Landing Page](https://Personal-Stack.github.io/personal-tools/) - Overview and navigation
- **💰 Budget Planner**: [Budget Tool](https://Personal-Stack.github.io/personal-tools/budget/) - Comprehensive budget management
- **📊 Analytics Dashboard**: [Revolut Analytics](https://Personal-Stack.github.io/personal-tools/revolut-analytics/) - Advanced financial analysis
- **�� Design System**: [Component Showcase](https://Personal-Stack.github.io/personal-tools/design_system/examples/component-showcase.html) - UI components demo

## 🎯 Quick Start Guide

### Budget Planner Usage
1. **Set Budget**: Configure your annual budget and preferred currency
2. **Investment Setup**: Define investment allocation (fixed amount or percentage)
3. **Add Expenses**: Create budget items with tags and frequencies
4. **View Analytics**: Monitor real-time calculations and visualizations
5. **Custom Charts**: Build personalized charts for detailed analysis
6. **Track Changes**: Review complete history with manual comments
7. **Backup Data**: Import/export functionality for data management

### Analytics Dashboard Usage
1. **Upload Data**: Import Revolut CSV transaction files
2. **Configure Filters**: Set up exclusion patterns for clean data analysis
3. **Review Risk Metrics**: Monitor spending volatility, drawdown risk, and trend analysis
4. **Detect Anomalies**: Identify unusual transactions requiring attention
5. **Category Analysis**: Assess risk levels across different spending categories
6. **Get Insights**: Receive personalized financial recommendations

## 🏗️ Project Structure

```
simple-budget/
├── index.html                          # Landing page and navigation hub
├── styles.css                          # Main application styling
├── feed.json                          # Sample budget data
├── sample-transactions.csv            # Sample analytics data
├── budget/                            # Budget Planner Application
│   ├── index.html                     # Budget planner interface
│   ├── script.js                      # Budget management logic
│   └── budget-compatibility.css       # Compact styling overrides
├── revolut-analytics/                 # Analytics Dashboard
│   ├── index.html                     # Analytics interface
│   ├── analytics.js                   # Advanced analytics engine
│   └── analytics.css                  # Analytics styling with theme support
├── design_system/                     # Complete Design System
│   ├── README.md                      # Design system documentation
│   ├── IMPLEMENTATION.md              # Implementation guidelines
│   ├── design-system.css             # Main design system styles
│   ├── components/                    # UI Component Library
│   │   ├── buttons.css                # Button variants and states
│   │   ├── cards.css                  # Card components and layouts
│   │   ├── forms.css                  # Form controls and validation
│   │   ├── modal.css                  # Modal dialogs and overlays
│   │   ├── navigation.css             # Navigation components
│   │   ├── snackbar.css/.js           # Toast notifications
│   │   ├── spinner.css                # Loading indicators
│   │   └── tooltip.css                # Tooltip components
│   ├── themes/                        # Theme Management
│   │   ├── dark.css                   # Dark theme overrides
│   │   └── theme-manager.js           # Theme switching logic
│   ├── tokens/                        # Design Tokens
│   │   ├── colors.css                 # Color palette and variables
│   │   ├── layout.css                 # Spacing and layout tokens
│   │   ├── spacing.css                # Spacing scale system
│   │   └── typography.css             # Font system and scales
│   └── examples/                      # Live Examples
│       └── component-showcase.html    # Interactive component demo
├── DEPLOYMENT.md                      # Deployment instructions
├── README.md                          # Project documentation
├── _config.yml                        # GitHub Pages configuration
└── .github/
    └── workflows/
        └── deploy.yml                 # GitHub Actions deployment
```

## 💾 Data Formats

### Budget Planner Data (JSON)
The budget application uses JSON format for comprehensive data exchange:

```json
{
  "settings": {
    "maxCash": 100000,
    "currency": "USD",
    "investment": {
      "type": "percentage",
      "value": 10,
      "frequency": "yearly"
    }
  },
  "items": [
    {
      "name": "rent",
      "value": 1200,
      "frequency": "monthly",
      "tags": ["housing", "essential"]
    }
  ],
  "changeHistory": [
    {
      "timestamp": "2024-01-15T10:30:00.000Z",
      "action": "item_added",
      "details": { "itemName": "rent", "value": 1200 },
      "comment": "Added monthly rent expense",
      "currency": "USD"
    }
  ]
}
```

### Analytics Data (CSV)
The analytics dashboard supports Revolut CSV exports with these key columns:

```csv
Type,Product,Completed Date,Description,Amount,Currency,Balance
Card Payment,Current,2024-01-15 10:30:00,COFFEE SHOP PURCHASE,-4.50,USD,1245.50
Transfer,Current,2024-01-15 09:00:00,Salary Payment,2500.00,USD,1250.00
Exchange,Current,2024-01-14 14:22:00,EUR to USD Exchange,-150.00,USD,750.00
```

**Supported Features:**
- **Automatic Parsing**: Smart detection of transaction types and categories
- **Exclusion Filters**: Configure patterns to exclude internal transfers and savings
- **Multi-Currency**: Handles different currencies with proper conversion tracking
- **Date Range Analysis**: Filter transactions by custom date ranges

## 🚀 Deployment

### Automatic Deployment (GitHub Pages)

This project is configured for automatic deployment to GitHub Pages:

1. **Fork or Clone**: Fork this repository or clone to your GitHub account
2. **Enable Pages**: Go to repository Settings → Pages
3. **Configure Source**: Select "GitHub Actions" as the source
4. **Auto-Deploy**: Every push to `main` branch triggers automatic deployment
5. **Access**: Your app will be available at `https://yourusername.github.io/personal-tools/`

### Manual Deployment

For manual deployment to any web server:

1. **Download Files**: Get all project files
2. **Upload**: Copy `index.html`, `script.js`, `styles.css` to your web server
3. **Access**: Open `index.html` in any modern web browser

### Local Development

To run locally:

1. **Clone Repository**:
   ```bash
   git clone https://github.com/yourusername/personal-tools.git
   cd personal-tools
   ```

2. **Serve Files**: Use any local web server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (with live-server)
   npx live-server
   
   # Or simply open index.html in your browser
   ```

3. **Access**: Navigate to `http://localhost:8000`

## 🛠️ Technology Stack

### Core Technologies
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js library with theme-aware configurations
- **Storage**: localStorage (browser-based persistence)
- **Deployment**: GitHub Pages with GitHub Actions
- **Architecture**: Modular ES6 classes with clean separation of concerns

### Advanced Features
- **Theme System**: CSS custom properties with JavaScript theme management
- **Responsive Design**: CSS Grid, Flexbox, and mobile-first approach
- **Analytics Engine**: Statistical analysis algorithms for financial insights
- **Data Processing**: CSV parsing, anomaly detection, and trend analysis
- **Design System**: Component-driven architecture with design tokens

### Performance & UX
- **Progressive Enhancement**: Works without JavaScript for basic functionality
- **Accessibility**: WCAG 2.1 AA compliance with proper ARIA attributes
- **Performance**: Optimized CSS and JavaScript with minimal dependencies
- **Cross-Browser**: Supports all modern browsers (Chrome, Firefox, Safari, Edge)

## � Key Features Deep Dive

### 🎯 Advanced Financial Analytics
- **Volatility Analysis**: Statistical calculation of spending consistency using standard deviation
- **Drawdown Assessment**: Maximum balance depletion tracking for financial stress identification
- **Trend Analysis**: Week-over-week spending pattern detection with directional indicators
- **Anomaly Detection**: Machine learning-inspired outlier identification (>2σ from mean)
- **Category Risk Scoring**: Volatility-based risk assessment for different expense categories
- **Personalized Insights**: Context-aware recommendations based on spending behavior patterns

### 🎨 Design System Components
- **Atomic Design**: Components built following atomic design principles (atoms → molecules → organisms)
- **Design Tokens**: Centralized design decisions in CSS custom properties
- **Theme Architecture**: Systematic approach to light/dark mode with proper contrast ratios
- **Component States**: Comprehensive hover, active, focus, and disabled states
- **Responsive Patterns**: Mobile-first components that scale gracefully across devices

### �📊 Supported Currencies
- **USD ($)** - US Dollar
- **EUR (€)** - Euro  
- **BGN (лв)** - Bulgarian Lev
- **GBP (£)** - British Pound
- **JPY (¥)** - Japanese Yen
- **CAD (C$)** - Canadian Dollar
- **AUD (A$)** - Australian Dollar
- **CHF (Fr)** - Swiss Franc

## 🤝 Contributing

We welcome contributions to improve the Simple Budget Suite! Here's how to get started:

### Development Setup
1. **Fork & Clone**: Fork the repository and clone to your local machine
2. **Local Server**: Use any local web server for development:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js with live-server
   npx live-server
   
   # VS Code Live Server extension
   # Or simply open index.html in browser
   ```

### Contribution Guidelines
1. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
2. **Follow Standards**: Use existing code style and design system patterns
3. **Test Thoroughly**: Ensure all applications work in both light and dark themes
4. **Update Documentation**: Update README if adding new features
5. **Commit & Push**: `git commit -m 'Add some amazing feature'`
6. **Pull Request**: Open a PR with clear description of changes

### Areas for Contribution
- **🔍 Analytics Features**: New financial analysis algorithms or visualizations
- **🎨 Design System**: Additional components or theme improvements  
- **📱 Accessibility**: WCAG compliance improvements and testing
- **🌐 Internationalization**: Additional language support
- **📊 Data Sources**: Support for other banking CSV formats
- **⚡ Performance**: Optimization and loading improvements

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🐛 Issues & Support

If you encounter any issues or have questions:

1. **Check Existing Issues**: Browse [Issues](https://github.com/Personal-Stack/personal-tools/issues) for similar problems
2. **Create Detailed Reports**: Include browser, device, and steps to reproduce
3. **Screenshots**: Visual aids help with UI-related issues
4. **Feature Requests**: Suggest improvements or new functionality
5. **Security Issues**: Report sensitive issues via private channels

## 📖 Documentation

- **[Design System Documentation](design_system/README.md)**: Comprehensive component guide
- **[Implementation Guide](design_system/IMPLEMENTATION.md)**: Developer integration instructions  
- **[Deployment Guide](DEPLOYMENT.md)**: Hosting and deployment options
- **Live Examples**: Interactive component showcase available in the design system

## 🎉 Acknowledgments

- **Chart.js**: Excellent charting library with extensive customization options
- **GitHub Pages**: Free hosting platform enabling easy deployment
- **Modern Web Standards**: CSS Custom Properties, ES6+ features, and responsive design
- **Open Source Community**: Inspiration from various financial and design system projects
- **Accessibility Guidelines**: WCAG 2.1 standards for inclusive design

---

**💡 Built with modern web technologies to enhance personal productivity and data-driven decision making.**