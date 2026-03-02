#  Calculator App

A web-based calculator with iPhone aesthetics, built with Flask (Python) and vanilla JS.

## 📁 Project Structure

```
calculator_app/
│
├── app.py                  # Flask backend — all calculation logic lives here
│
├── requirements.txt        # Python dependencies
│
├── templates/
│   └── index.html          # Main HTML template (Jinja2)
│
└── static/
    ├── css/
    │   └── style.css       # iPhone-style dark UI styling
    └── js/
        └── calculator.js   # Frontend logic & API calls
```

## 🚀 Setup & Run

1. **Create a virtual environment (recommended)**
   ```bash
   python -m venv venv
   source venv/bin/activate        # macOS/Linux
   venv\Scripts\activate           # Windows
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the app**
   ```bash
   python app.py
   ```

4. **Open in browser**
   ```
   http://127.0.0.1:5000
   ```

## ✨ Features

| Mode        | Operations                              |
|-------------|------------------------------------------|
| Arithmetic  | +, −, ×, ÷, %, +/− toggle, chaining    |
| Trigonometry| sin, cos, tan, csc, sec, cot (degrees)  |
| Square Root | √ of any non-negative number            |

- Full keyboard support in Arithmetic mode (`0-9`, `.`, `+`, `-`, `*`, `/`, `Enter`, `Esc`, `Backspace`)
- All calculations are processed server-side via `/calculate` API endpoint
- Error handling for division by zero, invalid inputs, and negative square roots
