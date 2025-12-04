let display = document.getElementById('display');

function appendNumber(number) {
    display.value += number;
}

function appendOperator(operator) {
    if (display.value.slice(-1) !== operator) {
        display.value += operator;
    }
}

function appendDecimal(decimal) {
    if (!display.value.includes('.')) {
        display.value += decimal;
    }
}

function clearDisplay() {
    display.value = '';
}

function calculateResult() {
    try {
        display.value = eval(display.value);
    } catch (error) {
        display.value = 'Error';
    }
}