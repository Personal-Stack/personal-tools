# Simple Budget Tracker

An HTML-based budget tracking application with interactive charts and real-time calculations.

## Features

### Core Functionality
- **Annual Budget Setup**: Set your maximum available cash per year
- **Flexible Item System**: Add budget items with comprehensive details:
  - **Name**: Descriptive name for the expense
  - **Value**: Monetary amount
  - **Tags**: Optional categorization labels for organization
  - **Frequency**: Daily, Weekly, Monthly, or Yearly occurrence
- **Smart Calculations**: Automatic conversion between frequencies and real-time updates
- **Dynamic Management**: Add and remove items with immediate recalculation

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
- **Frequency Flexibility**: Support for daily, weekly, monthly, and yearly expenses

## Usage

1. Open `index.html` in your web browser
2. Enter your annual budget amount
3. Add budget items using the flexible form:
   - Enter item name (e.g., "Rent", "Coffee", "Car Insurance")
   - Specify the amount 
   - Add optional tags for categorization (e.g., "housing, fixed")
   - Select frequency (Daily, Weekly, Monthly, or Yearly)
4. View real-time budget indicators and charts
5. Remove items as needed with automatic recalculation

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