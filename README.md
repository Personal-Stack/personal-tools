# Simple Budget Tracker

An HTML-based budget tracking application with interactive charts and real-time calculations.

## Features

### Core Functionality
- **Annual Budget Setup**: Set your maximum available cash per year
- **Default Budget Categories**: Pre-configured categories including:
  - Electricity, Water, Gas, Internet, Phone, Mortgage, Car Gas
  - Investment (percentage-based calculation)
- **Custom Categories**: Add and remove custom budget categories dynamically
- **Real-time Calculations**: Automatic updates of all totals and indicators

### Budget Indicators
- **Daily Maximum**: Available spending per day
- **Weekly Maximum**: Available spending per week  
- **Monthly Maximum**: Available spending per month
- **Yearly Maximum**: Available spending per year

### Visual Charts
- **Budget Breakdown Chart**: Doughnut chart showing expense distribution
- **Budget Overview Chart**: Bar chart comparing spent vs remaining budget
- Charts powered by Chart.js library

### Additional Features
- **Responsive Design**: Works on desktop and mobile devices
- **Data Persistence**: Automatically saves data to local storage
- **Budget Status**: Visual indicators for under/on/over budget status
- **Investment Calculation**: Special handling for percentage-based investments

## Usage

1. Open `index.html` in your web browser
2. Enter your annual budget amount
3. Fill in your monthly expenses for default categories
4. Set investment as a percentage of monthly budget
5. Add custom categories as needed
6. View real-time budget indicators and charts

## Technical Details

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js 3.9.1
- **Storage**: LocalStorage for data persistence
- **Responsive**: CSS Grid and Flexbox for responsive design

## Files

- `index.html` - Main application page
- `styles.css` - Complete styling and responsive design
- `script.js` - All application logic and Chart.js integration

## Screenshot

The application provides a clean, professional interface for budget tracking:

![Budget Tracker Screenshot](https://github.com/user-attachments/assets/552e49b9-a0d8-4f68-9221-19cde93d38c1)

*Example showing $60,000 annual budget with various expense categories and real-time calculations*