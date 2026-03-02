from flask import Flask, render_template, request, jsonify
import math

app = Flask(__name__)


def calculate_trig(func, angle_deg):
    """Calculate trigonometric function value for given angle in degrees."""
    angle_rad = math.radians(angle_deg)
    trig_funcs = {
        "sin":   lambda r: math.sin(r),
        "cos":   lambda r: math.cos(r),
        "tan":   lambda r: math.tan(r),
        "cosec": lambda r: 1 / math.sin(r),
        "sec":   lambda r: 1 / math.cos(r),
        "cot":   lambda r: 1 / math.tan(r),
    }
    if func not in trig_funcs:
        raise ValueError(f"Unknown trig function: {func}")
    # Guard against division by zero
    result = trig_funcs[func](angle_rad)
    return round(result, 10)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/calculate", methods=["POST"])
def calculate():
    data = request.get_json()
    calc_type = data.get("type")

    try:
        if calc_type == "arithmetic":
            operator = data.get("operator")
            operands = [float(n) for n in data.get("operands", [])]

            if operator == "+":
                result = sum(operands)
            elif operator == "-":
                if len(operands) != 2:
                    raise ValueError("Subtraction requires exactly 2 operands.")
                result = operands[0] - operands[1]
            elif operator == "x":
                result = math.prod(operands)
            elif operator == "/":
                if len(operands) != 2:
                    raise ValueError("Division requires exactly 2 operands.")
                if operands[1] == 0:
                    raise ZeroDivisionError("Cannot divide by zero.")
                result = operands[0] / operands[1]
            elif operator == "%":
                if len(operands) != 1:
                    raise ValueError("Percentage requires exactly 1 operand.")
                result = operands[0] / 100
            else:
                raise ValueError(f"Unknown operator: {operator}")

        elif calc_type == "root":
            number = float(data.get("number"))
            if number < 0:
                raise ValueError("Cannot take square root of a negative number.")
            result = math.sqrt(number)

        elif calc_type == "trig":
            func = data.get("func")
            angle = float(data.get("angle"))
            result = calculate_trig(func, angle)

        else:
            raise ValueError(f"Unknown calculation type: {calc_type}")

        # Return clean int if result is whole number
        if isinstance(result, float) and result.is_integer():
            result = int(result)

        return jsonify({"result": result})

    except ZeroDivisionError as e:
        return jsonify({"error": str(e)}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred."}), 500


if __name__ == "__main__":
    app.run(debug=True)
