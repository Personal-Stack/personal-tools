# Budget Planner 💰

A comprehensive budget tracking application with multi-currency support, investment allocation, dynamic charts, and change history tracking.

## 🌟 Features

- **💱 Multi-Currency Support**: Track budgets in 8 different currencies with real-time conversion
- **📈 Investment Planning**: Set investment allocations with flexible frequency options
- **📊 Dynamic Visualization**: Create custom charts filtered by tags, frequencies, or combinations
- **📝 Change History**: Complete audit trail with manual comments and import/export capabilities
- **📥📤 Data Import/Export**: JSON-based data exchange with comprehensive validation
- **⚡ Real-time Updates**: Immediate calculations and chart updates
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Live Demo

Visit the live application: [Budget Planner](https://bbogdanov.github.io/simple-budget/)

## 🎯 Usage

1. **Set Budget**: Configure your annual budget and preferred currency
2. **Investment Setup**: Define investment allocation (fixed amount or percentage)
3. **Add Expenses**: Create budget items with tags and frequencies
4. **View Analytics**: Monitor real-time calculations and visualizations
5. **Custom Charts**: Build personalized charts for detailed analysis
6. **Track Changes**: Review complete history with manual comments
7. **Backup Data**: Import/export functionality for data management

## 🏗️ Project Structure

```
simple-budget/
├── index.html          # Main application interface
├── script.js           # Core application logic and budget tracker
├── styles.css          # Application styling and responsive design
├── feed.json           # Sample data file for testing imports
├── README.md           # Project documentation
├── _config.yml         # GitHub Pages configuration
└── .github/
    └── workflows/
        └── deploy.yml  # GitHub Actions deployment workflow
```

## 💾 Data Format

The application uses JSON format for comprehensive data exchange:

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

## 🚀 Deployment

### Automatic Deployment (GitHub Pages)

This project is configured for automatic deployment to GitHub Pages:

1. **Fork or Clone**: Fork this repository or clone to your GitHub account
2. **Enable Pages**: Go to repository Settings → Pages
3. **Configure Source**: Select "GitHub Actions" as the source
4. **Auto-Deploy**: Every push to `main` branch triggers automatic deployment
5. **Access**: Your app will be available at `https://yourusername.github.io/simple-budget/`

### Manual Deployment

For manual deployment to any web server:

1. **Download Files**: Get all project files
2. **Upload**: Copy `index.html`, `script.js`, `styles.css` to your web server
3. **Access**: Open `index.html` in any modern web browser

### Local Development

To run locally:

1. **Clone Repository**:
   ```bash
   git clone https://github.com/yourusername/simple-budget.git
   cd simple-budget
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

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js library
- **Storage**: localStorage (browser-based persistence)
- **Deployment**: GitHub Pages with GitHub Actions
- **Responsive**: CSS Grid and Flexbox

## 📊 Supported Currencies

- USD ($) - US Dollar
- EUR (€) - Euro
- BGN (лв) - Bulgarian Lev
- GBP (£) - British Pound
- JPY (¥) - Japanese Yen
- CAD (C$) - Canadian Dollar
- AUD (A$) - Australian Dollar
- CHF (Fr) - Swiss Franc

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🐛 Issues & Support

If you encounter any issues or have questions:

1. Check existing [Issues](https://github.com/bbogdanov/simple-budget/issues)
2. Create a new issue with detailed description
3. Include screenshots if applicable
4. Mention browser and device information

## 🎉 Acknowledgments

- Chart.js for excellent charting library
- GitHub Pages for free hosting
- Modern web standards for making this possible