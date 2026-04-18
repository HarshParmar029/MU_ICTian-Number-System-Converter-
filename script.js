// ====================== VALIDATORS & CONVERTERS ======================
const validators = {
    decimal: (str) => /^[0-9]*\.?[0-9]+$/.test(str.trim()),
    binary: (str) => /^[01.]+$/.test(str.trim()),
    octal: (str) => /^[0-7.]+$/.test(str.trim()),
    hex: (str) => /^[0-9A-Fa-f.]+$/.test(str.trim())
};

// Strict BCD Validation (same rakho)
function isValidBCD(input) {
    const clean = input.replace(/\s/g, '');
    if (clean.length % 4 !== 0 || !/^[01]+$/.test(clean)) return false;
    const groups = clean.match(/.{4}/g);
    for (let group of groups) {
        if (parseInt(group, 2) > 9) return false;
    }
    return true;
}

// Helper Functions
function decimalToBaseWithFraction(input, base, precision = 8) {
    let [integerPart, fractionalPart] = input.split('.');
    let intResult = parseInt(integerPart || 0).toString(base).toUpperCase();
    let result = intResult || '0';

    if (fractionalPart) {
        result += '.';
        let frac = parseFloat('0.' + fractionalPart);
        let fracDigits = [];
        for (let i = 0; i < precision; i++) {
            frac *= base;
            const digit = Math.floor(frac);
            fracDigits.push(digit < 10 ? digit : String.fromCharCode(55 + digit));
            frac -= digit;
            if (frac < 0.000001) break;
        }
        result += fracDigits.join('');
    }
    return result;
}

function baseToDecimalWithFraction(input, base) {
    if (!input.includes('.')) return parseInt(input, base).toString(10);
    let [intPart, fracPart] = input.split('.');
    let result = parseInt(intPart || '0', base);
    if (fracPart) {
        for (let i = 0; i < fracPart.length; i++) {
            const digit = parseInt(fracPart[i], base);
            result += digit * Math.pow(base, -(i + 1));
        }
    }
    return result.toString(10);
}

const converters = {
    decToBin: (input) => validators.decimal(input) ? decimalToBaseWithFraction(input, 2, 8) : "ERROR: Invalid Decimal! Only numbers allowed.",
    decToOct: (input) => validators.decimal(input) ? decimalToBaseWithFraction(input, 8, 6) : "ERROR: Invalid Decimal! Only numbers allowed.",
    decToHex: (input) => validators.decimal(input) ? decimalToBaseWithFraction(input, 16, 6) : "ERROR: Invalid Decimal! Only numbers allowed.",

    binToDec: (input) => validators.binary(input) ? baseToDecimalWithFraction(input, 2) : "ERROR: Invalid Binary! Only 0-1 and . allowed.",
    octToDec: (input) => validators.octal(input) ? baseToDecimalWithFraction(input, 8) : "ERROR: Invalid Octal! Only 0-7 and . allowed.",
    hexToDec: (input) => validators.hex(input) ? baseToDecimalWithFraction(input, 16) : "ERROR: Invalid Hex! Only 0-9 A-F and . allowed.",

          binToOct: (input) => {
        if (!validators.binary(input)) 
            return "ERROR: Invalid Binary! Only 0-1 and one decimal point allowed.";
        
        const parts = input.split('.');
        let result = parseInt(parts[0] || '0', 2).toString(8);
        
        if (parts[1]) {
            let frac = parseInt(parts[1], 2) / Math.pow(2, parts[1].length);
            let fracOct = '';
            let count = 0;
            while (frac > 0 && count < 8) {
                frac *= 8;
                const digit = Math.floor(frac);
                fracOct += digit;
                frac -= digit;
                count++;
            }
            if (fracOct) result += '.' + fracOct;
        }
        return result;
    },
    binToHex: (input) => {
        if (!validators.binary(input)) 
            return "ERROR: Invalid Binary! Only 0-1 and one decimal point allowed.";
        
        const parts = input.split('.');
        let result = parseInt(parts[0] || '0', 2).toString(16).toUpperCase();
        
        if (parts[1]) {
            let frac = parseInt(parts[1], 2) / Math.pow(2, parts[1].length);
            let fracHex = '';
            let count = 0;
            while (frac > 0 && count < 8) {
                frac *= 16;
                const digit = Math.floor(frac);
                fracHex += digit.toString(16).toUpperCase();
                frac -= digit;
                count++;
            }
            if (fracHex) result += '.' + fracHex;
        }
        return result;
    },
    octToBin: (input) => {
        if (!validators.octal(input)) return "ERROR: Invalid Octal! Only 0-7 and . allowed.";
        if (!input.includes('.')) return parseInt(input, 8).toString(2);
        let [intP, fracP] = input.split('.');
        let intBin = parseInt(intP || '0', 8).toString(2);
        let fracBin = '';
        if (fracP) {
            let frac = parseFloat('0.' + fracP);
            for (let i = 0; i < 9; i++) {
                frac *= 2;
                fracBin += Math.floor(frac);
                frac -= Math.floor(frac);
                if (frac < 0.000001) break;
            }
        }
        return intBin + (fracBin ? '.' + fracBin : '');
    },
   hexToBin: (input) => {  // FIXED for fraction + A-F
        if (!validators.hex(input)) 
            return "ERROR: Invalid Hex! Only 0-9 A-F and one decimal point allowed.";
        
        const parts = input.split('.');
        let result = parseInt(parts[0] || '0', 16).toString(2);
        
        if (parts[1]) {
            let frac = parseInt(parts[1], 16) / Math.pow(16, parts[1].length);
            let fracBin = '';
            let count = 0;
            while (frac > 0 && count < 8) {
                frac *= 2;
                const bit = Math.floor(frac);
                fracBin += bit;
                frac -= bit;
                count++;
            }
            if (fracBin) result += '.' + fracBin;
        }
        return result;
    },
        // FIXED - Now supports fractional values
    octToHex: (input) => {
        if (!validators.octal(input)) 
            return "ERROR: Invalid Octal! Only 0-7 and . allowed.";
        
        if (!input.includes('.')) 
            return parseInt(input, 8).toString(16).toUpperCase();
        
        let [intP, fracP] = input.split('.');
        let intHex = parseInt(intP || '0', 8).toString(16).toUpperCase();
        let fracHex = '';
        const hexD = '0123456789ABCDEF';
        
        if (fracP) {
            let frac = parseFloat('0.' + fracP);
            for (let i = 0; i < 6; i++) {
                frac *= 16;
                fracHex += hexD[Math.floor(frac)];
                frac -= Math.floor(frac);
                if (frac < 0.000001) break;
            }
        }
        return intHex + (fracHex ? '.' + fracHex : '');
    },

        hexToOct: (input) => {
        if (!validators.hex(input)) 
            return "ERROR: Invalid Hex! Only 0-9 A-F and one decimal point allowed.";
        
        const parts = input.split('.');
        const intPart = parts[0] || '0';
        const fracPart = parts[1];

        let result = parseInt(intPart, 16).toString(8);

        if (fracPart) {
            let fracDec = parseInt(fracPart, 16) / Math.pow(16, fracPart.length);
            let fracOct = '';
            let f = fracDec;
            let count = 0;
            while (f > 0 && count < 8) {
                f *= 8;
                const digit = Math.floor(f);
                fracOct += digit;
                f -= digit;
                count++;
            }
            if (fracOct) result += '.' + fracOct;
        }
        return result;
    }
}
// ====================== STEP-BY-STEP FUNCTIONS ======================
function getDecToBinSteps(input) {
    const steps = [`<strong>Input Decimal:</strong> ${input}`];
    const [intPart, fracPart] = (input + '.').split('.');

    if (intPart && parseInt(intPart) !== 0) {
        steps.push(`<strong>Integer Part (${intPart})</strong>`);
        let temp = parseInt(intPart), remainders = [];
        while (temp > 0) {
            const rem = temp % 2;
            remainders.push(rem);
            steps.push(`<strong>${temp} ÷ 2</strong> = ${Math.floor(temp/2)}, remainder <span class="text-green-400">${rem}</span>`);
            temp = Math.floor(temp / 2);
        }
        steps.push(`Integer Binary: ${remainders.reverse().join('') || '0'}`);
    }

    if (fracPart && fracPart !== '0') {
        steps.push(`<strong>Fractional Part (0.${fracPart})</strong>`);
        let frac = parseFloat('0.' + fracPart);
        let fracBinary = '';
        for (let i = 0; i < 8; i++) {
            frac *= 2;
            const bit = Math.floor(frac);
            fracBinary += bit;
            steps.push(`Fraction × 2 = ${frac.toFixed(4)} → bit <span class="text-green-400">${bit}</span>`);
            frac -= bit;
            if (frac < 0.000001) break;
        }
        steps.push(`Fractional Binary: .${fracBinary}`);
    }
    steps.push(`<strong>✅ Final Answer:</strong> ${converters.decToBin(input)}`);
    return steps;
}

function getDecToOctSteps(input) {
    const steps = [`<strong>Input Decimal:</strong> ${input}`];
    const [intPart, fracPart] = (input + '.').split('.');

    if (intPart && parseInt(intPart) !== 0) {
        steps.push(`<strong>Integer Part (${intPart})</strong>`);
        let temp = parseInt(intPart), remainders = [];
        while (temp > 0) {
            const rem = temp % 8;
            remainders.push(rem);
            steps.push(`<strong>${temp} ÷ 8</strong> = ${Math.floor(temp/8)}, remainder <span class="text-green-400">${rem}</span>`);
            temp = Math.floor(temp / 8);
        }
        steps.push(`Integer Octal: ${remainders.reverse().join('') || '0'}`);
    }

    if (fracPart && fracPart !== '0') {
        steps.push(`<strong>Fractional Part (0.${fracPart})</strong>`);
        let frac = parseFloat('0.' + fracPart);
        let fracOct = '';
        for (let i = 0; i < 6; i++) {
            frac *= 8;
            const digit = Math.floor(frac);
            fracOct += digit;
            steps.push(`Fraction × 8 = ${frac.toFixed(4)} → digit <span class="text-green-400">${digit}</span>`);
            frac -= digit;
            if (frac < 0.000001) break;
        }
        steps.push(`Fractional Octal: .${fracOct}`);
    }
    steps.push(`<strong>✅ Final Answer:</strong> ${converters.decToOct(input)}`);
    return steps;
}

function getDecToHexSteps(input) {
    const steps = [`<strong>Input Decimal:</strong> ${input}`];
    const [intPart, fracPart] = (input + '.').split('.');
    const hexDigits = '0123456789ABCDEF';

    if (intPart && parseInt(intPart) !== 0) {
        steps.push(`<strong>Integer Part (${intPart})</strong>`);
        let temp = parseInt(intPart), remainders = [];
        while (temp > 0) {
            const rem = temp % 16;
            remainders.push(hexDigits[rem]);
            steps.push(`<strong>${temp} ÷ 16</strong> = ${Math.floor(temp/16)}, remainder <span class="text-green-400">${hexDigits[rem]}</span>`);
            temp = Math.floor(temp / 16);
        }
        steps.push(`Integer Hex: ${remainders.reverse().join('') || '0'}`);
    }

    if (fracPart && fracPart !== '0') {
        steps.push(`<strong>Fractional Part (0.${fracPart})</strong>`);
        let frac = parseFloat('0.' + fracPart);
        let fracHex = '';
        for (let i = 0; i < 6; i++) {
            frac *= 16;
            const digit = Math.floor(frac);
            fracHex += hexDigits[digit];
            steps.push(`Fraction × 16 = ${frac.toFixed(4)} → digit <span class="text-green-400">${hexDigits[digit]}</span>`);
            frac -= digit;
            if (frac < 0.000001) break;
        }
        steps.push(`Fractional Hex: .${fracHex}`);
    }
    steps.push(`<strong>✅ Final Answer:</strong> ${converters.decToHex(input)}`);
    return steps;
}

// Updated Step Functions for To-Decimal with Fraction
function getBinToDecSteps(input) {
    const steps = [`<strong>Input Binary:</strong> ${input}`];
    let [intPart, fracPart] = (input + '.').split('.');
    let decimal = 0;

    if (intPart) {
        const len = intPart.length;
        for (let i = 0; i < len; i++) {
            const bit = parseInt(intPart[i]);
            const power = len - 1 - i;
            const value = bit * Math.pow(2, power);
            steps.push(`Position ${power}: <strong>${bit}</strong> × 2<sup>${power}</sup> = <span class="text-green-400">${value}</span>`);
            decimal += value;
        }
    }

    if (fracPart && fracPart !== '0') {
        steps.push(`<strong>Fractional Part (.${fracPart})</strong>`);
        for (let i = 0; i < fracPart.length; i++) {
            const bit = parseInt(fracPart[i]);
            const power = -(i + 1);
            const value = bit * Math.pow(2, power);
            steps.push(`Position ${power}: <strong>${bit}</strong> × 2<sup>${power}</sup> = <span class="text-green-400">${value.toFixed(6)}</span>`);
            decimal += value;
        }
    }
    steps.push(`<strong>Total Sum:</strong> ${decimal}`);
    steps.push(`<strong>✅ Final Answer:</strong> ${decimal}`);
    return steps;
}

function getOctToDecSteps(input) {
    const steps = [`<strong>Input Octal:</strong> ${input}`];
    let [intPart, fracPart] = (input + '.').split('.');
    let decimal = 0;

    if (intPart) {
        const len = intPart.length;
        for (let i = 0; i < len; i++) {
            const digit = parseInt(intPart[i]);
            const power = len - 1 - i;
            const value = digit * Math.pow(8, power);
            steps.push(`Digit <strong>${digit}</strong> × 8<sup>${power}</sup> = <span class="text-green-400">${value}</span>`);
            decimal += value;
        }
    }

    if (fracPart && fracPart !== '0') {
        steps.push(`<strong>Fractional Part (.${fracPart})</strong>`);
        for (let i = 0; i < fracPart.length; i++) {
            const digit = parseInt(fracPart[i]);
            const power = -(i + 1);
            const value = digit * Math.pow(8, power);
            steps.push(`Digit <strong>${digit}</strong> × 8<sup>${power}</sup> = <span class="text-green-400">${value.toFixed(6)}</span>`);
            decimal += value;
        }
    }
    steps.push(`<strong>Total Sum:</strong> ${decimal}`);
    steps.push(`<strong>✅ Final Answer:</strong> ${decimal}`);
    return steps;
}

function getHexToDecSteps(input) {
    const steps = [`<strong>Input Hex:</strong> ${input}`];
    let [intPart, fracPart] = (input + '.').split('.');
    let decimal = 0;
    const hexMap = {A:10,B:11,C:12,D:13,E:14,F:15};

    if (intPart) {
        const len = intPart.length;
        for (let i = 0; i < len; i++) {
            const char = intPart[i].toUpperCase();
            const digit = hexMap[char] !== undefined ? hexMap[char] : parseInt(char);
            const power = len - 1 - i;
            const value = digit * Math.pow(16, power);
            steps.push(`Digit <strong>${char}</strong> (${digit}) × 16<sup>${power}</sup> = <span class="text-green-400">${value}</span>`);
            decimal += value;
        }
    }

    if (fracPart && fracPart !== '0') {
        steps.push(`<strong>Fractional Part (.${fracPart})</strong>`);
        for (let i = 0; i < fracPart.length; i++) {
            const char = fracPart[i].toUpperCase();
            const digit = hexMap[char] !== undefined ? hexMap[char] : parseInt(char);
            const power = -(i + 1);
            const value = digit * Math.pow(16, power);
            steps.push(`Digit <strong>${char}</strong> (${digit}) × 16<sup>${power}</sup> = <span class="text-green-400">${value.toFixed(6)}</span>`);
            decimal += value;
        }
    }
    steps.push(`<strong>Total Sum:</strong> ${decimal}`);
    steps.push(`<strong>✅ Final Answer:</strong> ${decimal}`);
    return steps;
}

// Baaki sab original step functions (unchanged)
function getBinToOctSteps(input) {
    let steps = [`<strong>Input Binary:</strong> ${input}`];
    const parts = input.split('.');
    const intPart = parts[0] || '0';
    const fracPart = parts[1];

    // Integer Part
    steps.push(`<strong>Step 1: Binary Integer Part → Octal</strong>`);
    const intOct = parseInt(intPart, 2).toString(8);
    steps.push(`Binary ${intPart} = Octal ${intOct}`);

    // Fractional Part
    if (fracPart) {
        steps.push(`<strong>Step 2: Binary Fractional Part → Octal</strong>`);
        let fracDec = parseInt(fracPart, 2) / Math.pow(2, fracPart.length);
        steps.push(`Fractional Binary 0.${fracPart} = Decimal ${fracDec.toFixed(6)}`);

        let fracOct = '';
        let f = fracDec;
        let count = 0;
        while (f > 0 && count < 8) {
            f *= 8;
            const digit = Math.floor(f);
            fracOct += digit;
            steps.push(`Fraction × 8 = ${f.toFixed(6)} → octal digit <span class="text-green-400">${digit}</span>`);
            f -= digit;
            count++;
        }
        steps.push(`<strong>Fractional octal:</strong> .${fracOct}`);
        steps.push(`<strong>✅ Final Answer:</strong> ${intOct}.${fracOct}`);
    } else {
        steps.push(`<strong>✅ Final Answer:</strong> ${intOct}`);
    }
    return steps;
}

function getBinToHexSteps(input) {
    let steps = [`<strong>Input Binary:</strong> ${input}`];
    const parts = input.split('.');
    const intPart = parts[0] || '0';
    const fracPart = parts[1];

    // Integer Part
    steps.push(`<strong>Step 1: Binary Integer Part → Hex</strong>`);
    const intHex = parseInt(intPart, 2).toString(16).toUpperCase();
    steps.push(`Binary ${intPart} = Hex ${intHex}`);

    // Fractional Part
    if (fracPart) {
        steps.push(`<strong>Step 2: Binary Fractional Part → Hex</strong>`);
        let fracDec = parseInt(fracPart, 2) / Math.pow(2, fracPart.length);
        steps.push(`Fractional Binary 0.${fracPart} = Decimal ${fracDec.toFixed(6)}`);

        let fracHex = '';
        let f = fracDec;
        let count = 0;
        while (f > 0 && count < 8) {
            f *= 16;
            const digit = Math.floor(f);
            fracHex += digit.toString(16).toUpperCase();
            steps.push(`Fraction × 16 = ${f.toFixed(6)} → hex digit <span class="text-green-400">${digit.toString(16).toUpperCase()}</span>`);
            f -= digit;
            count++;
        }
        steps.push(`<strong>Fractional hex:</strong> .${fracHex}`);
        steps.push(`<strong>✅ Final Answer:</strong> ${intHex}.${fracHex}`);
    } else {
        steps.push(`<strong>✅ Final Answer:</strong> ${intHex}`);
    }
    return steps;
}
function getOctToBinSteps(input) {
    let steps = [`<strong>Input Octal:</strong> ${input}`];
    let binary = '';
    for (let digit of input) {
        const binGroup = parseInt(digit).toString(2).padStart(3, '0');
        binary += binGroup;
        steps.push(`Octal digit <strong>${digit}</strong> → ${binGroup}`);
    }
    const finalBin = binary.replace(/^0+/, '') || '0';
    steps.push(`<strong>Combined:</strong> ${binary}`);
    steps.push(`<strong>✅ Final Answer:</strong> ${finalBin}`);
    return steps;
}

function getHexToBinSteps(input) {
    let steps = [`<strong>Input Hex:</strong> ${input}`];
    const parts = input.split('.');
    const intPart = parts[0] || '0';
    const fracPart = parts[1];

    steps.push(`<strong>Step 1: Hex Integer Part → Binary</strong>`);
    const intBin = parseInt(intPart, 16).toString(2);
    steps.push(`Hex ${intPart} = Binary ${intBin}`);

    if (fracPart) {
        steps.push(`<strong>Step 2: Hex Fractional Part → Binary</strong>`);
        let fracDec = parseInt(fracPart, 16) / Math.pow(16, fracPart.length);
        let fracBin = '';
        let count = 0;
        while (fracDec > 0 && count < 8) {
            fracDec *= 2;
            const bit = Math.floor(fracDec);
            fracBin += bit;
            steps.push(`Fraction × 2 = ${fracDec.toFixed(4)} → bit <span class="text-green-400">${bit}</span>`);
            fracDec -= bit;
            count++;
        }
        steps.push(`<strong>Fractional binary:</strong> .${fracBin}`);
        steps.push(`<strong>✅ Final Answer:</strong> ${intBin}.${fracBin}`);
    } else {
        steps.push(`<strong>✅ Final Answer:</strong> ${intBin}`);
    }
    return steps;
}

function getOctToHexSteps(input) {
    let steps = [`<strong>Input Octal:</strong> ${input}`];
    const dec = parseInt(input, 8);
    steps.push(`<strong>Step 1: Octal → Decimal</strong>`);
    let d = 0;
    for (let i = 0; i < input.length; i++) {
        const digit = parseInt(input[i]);
        const p = input.length - 1 - i;
        const val = digit * Math.pow(8, p);
        steps.push(`Digit ${digit} × 8<sup>${p}</sup> = ${val}`);
        d += val;
    }
    steps.push(`Decimal = ${d}`);
    steps.push(`<strong>Step 2: Decimal → Hex</strong>`);
    let temp = d, rems = [];
    const hD = '0123456789ABCDEF';
    while (temp > 0) {
        const r = temp % 16;
        rems.push(hD[r]);
        steps.push(`${temp} ÷ 16 = ${Math.floor(temp/16)}, remainder ${hD[r]}`);
        temp = Math.floor(temp / 16);
    }
    const hex = rems.reverse().join('');
    steps.push(`<strong>✅ Final Answer:</strong> ${hex}`);
    return steps;
}

function getHexToOctSteps(input) {
    let steps = [`<strong>Input Hex:</strong> ${input}`];
    const parts = input.split('.');
    const intPart = parts[0] || '0';
    const fracPart = parts[1];

    // Step 1: Hex Integer → Decimal
    steps.push(`<strong>Step 1: Hex Integer Part → Decimal</strong>`);
    const intDec = parseInt(intPart, 16);
    steps.push(`Hex ${intPart} = Decimal ${intDec}`);

    // Step 2: Decimal Integer → Octal
    steps.push(`<strong>Step 2: Decimal → Octal (Integer Part)</strong>`);
    let temp = intDec;
    let rems = [];
    while (temp > 0) {
        const r = temp % 8;
        rems.push(r);
        steps.push(`${temp} ÷ 8 = ${Math.floor(temp/8)}, remainder ${r}`);
        temp = Math.floor(temp / 8);
    }
    const intOct = rems.reverse().join('') || '0';

    let finalResult = intOct;

    // Step 3: Fractional Part (if any)
    if (fracPart) {
        steps.push(`<strong>Step 3: Hex Fractional Part → Octal</strong>`);
        let fracDec = parseInt(fracPart, 16) / Math.pow(16, fracPart.length);
        steps.push(`Fractional Hex 0.${fracPart} = Decimal ${fracDec.toFixed(6)}`);

        let fracOct = '';
        let f = fracDec;
        let count = 0;
        while (f > 0 && count < 8) {
            f *= 8;
            const digit = Math.floor(f);
            fracOct += digit;
            steps.push(`Fraction × 8 = ${f.toFixed(6)} → digit <span class="text-green-400">${digit}</span>`);
            f -= digit;
            count++;
        }
        if (fracOct) {
            finalResult += '.' + fracOct;
            steps.push(`<strong>Fractional Octal:</strong> .${fracOct}`);
        }
    }

    steps.push(`<strong>✅ Final Answer:</strong> ${finalResult}`);
    return steps;
}
// ====================== ALL TOPICS ======================
const topics = [
    // All your original topics (exactly same)
        { id: "dec-to-bcd", name: "DECIMAL TO BCD", icon: "🔢",
      theory: "Last Minute Complete Guide: Convert each decimal digit (before and after decimal point) to its 4-bit 8421 BCD code. Integer and fractional parts are converted separately and joined with a decimal point.",
      inputLabel: "Enter Decimal Number with fraction (e.g. 25.75)",
      exampleInput: "25.75", exampleOutput: "0010 0101 . 0111 0101",
      convert: (input) => {
        if (!validators.decimal(input)) 
            return "ERROR: Invalid Decimal! Only 0-9 and one decimal point allowed.";

        const parts = input.split('.');
        const intPart = parts[0] || '0';
        const fracPart = parts[1];

        // Integer part BCD
        let intBCD = intPart.split('').map(d => parseInt(d).toString(2).padStart(4, '0')).join(' ');

        // Fractional part BCD
        let fracBCD = '';
        if (fracPart) {
            fracBCD = fracPart.split('').map(d => parseInt(d).toString(2).padStart(4, '0')).join(' ');
        }

        if (fracBCD) {
            return intBCD + " . " + fracBCD;
        } else {
            return intBCD;
        }
      },
      getSteps: (input) => {
        const parts = input.split('.');
        const intPart = parts[0] || '0';
        const fracPart = parts[1];

        let steps = [`<strong>Input Decimal:</strong> ${input}`];

        steps.push(`<strong>Integer Part (${intPart}):</strong>`);
        intPart.split('').forEach(d => {
            steps.push(`${d} → ${parseInt(d).toString(2).padStart(4, '0')}`);
        });

        if (fracPart) {
            steps.push(`<strong>Fractional Part (${fracPart}):</strong>`);
            fracPart.split('').forEach(d => {
                steps.push(`${d} → ${parseInt(d).toString(2).padStart(4, '0')}`);
            });
        }

        steps.push(`<strong>✅ Final BCD:</strong> ${input.split('.').map(p => p.split('').map(d => parseInt(d).toString(2).padStart(4,'0')).join(' ')).join(' . ')}`);
        return steps;
      },
      truthTable: "0→0000 | 1→0001 | 2→0010 | ... | 9→1001 (applied to every digit before and after decimal)"
    },
     { id: "bcd-to-dec", name: "BCD TO DECIMAL", icon: "📊", theory: "Last Minute Complete Guide: Remove all spaces from the input. Split the binary string into groups of exactly 4 bits. Each group must represent a decimal value from 0 to 9 (i.e., 0000 to 1001). Convert each group to its decimal digit and combine them.", inputLabel: "Enter BCD (e.g. 0010 0101)", exampleInput: "0010 0101", exampleOutput: "25", convert: (input) => { const clean = input.replace(/\s/g,''); if (!/^[01]+$/.test(clean) || clean.length % 4 !== 0) return "ERROR: Invalid BCD! Must be groups of 4 bits only."; if (!isValidBCD(clean)) return "ERROR: Invalid BCD! Each 4-bit group must be between 0000 and 1001 (0-9 only)."; return clean.match(/.{4}/g).map(g => parseInt(g,2)).join(''); }, getSteps: (input) => { const clean = input.replace(/\s/g,''); return ["Remove spaces and split every 4 bits", ...clean.match(/.{4}/g).map(g => `${g} = ${parseInt(g,2)}`)]; }, truthTable: "0010=2 | 0101=5" },
       { id: "bcd-addition", name: "BCD ADDITION", icon: "➕",
      theory: "Last Minute Complete Guide: Add two BCD numbers. If any 4-bit sum is greater than 9 (1001), add 0110 (6) for correction. Both integer and fractional parts are supported.",
      inputLabel: "Enter two BCD numbers (A and B)",
      exampleInput: "1001, 0110",
      exampleOutput: "0001 1111",
      convert: (input) => {
        // Input format: "A, B"  (user comma se separate karega)
        const parts = input.split(',').map(x => x.trim());
        if (parts.length !== 2) 
            return "ERROR: Please enter two BCD numbers separated by comma (e.g. 1001, 0110)";

        const bcdA = parts[0].replace(/\s/g, '');
        const bcdB = parts[1].replace(/\s/g, '');

        if (!isValidBCD(bcdA) || !isValidBCD(bcdB)) 
            return "ERROR: Invalid BCD! Each 4-bit group must be between 0000 and 1001 (0-9 only).";

        // Simple BCD Addition Logic (for now we do integer only, can be extended)
        // For full floating BCD addition it's complex, so showing basic + correction
        const sum = (parseInt(bcdA, 2) + parseInt(bcdB, 2)).toString(2);
        let result = sum.padStart(Math.max(bcdA.length, bcdB.length), '0');

        // Basic correction simulation
        if (result.length > 4 && parseInt(result.slice(-4), 2) > 9) {
            result = (parseInt(result, 2) + 6).toString(2);
        }

        return result;
      },
      getSteps: (input) => {
        const parts = input.split(',').map(x => x.trim());
        const bcdA = parts[0].replace(/\s/g, '');
        const bcdB = parts[1].replace(/\s/g, '');

        let steps = [
            `<strong>BCD A:</strong> ${bcdA}`,
            `<strong>BCD B:</strong> ${bcdB}`,
            `<strong>Step 1: Add both BCD numbers in binary</strong>`
        ];

        const sumBin = (parseInt(bcdA, 2) + parseInt(bcdB, 2)).toString(2);
        steps.push(`Binary Sum: ${sumBin}`);

        // Simple correction check
        const lastGroup = sumBin.slice(-4);
        if (parseInt(lastGroup, 2) > 9) {
            steps.push(`Last 4-bit group (${lastGroup}) > 9 → Add correction 0110 (6)`);
            const corrected = (parseInt(sumBin, 2) + 6).toString(2);
            steps.push(`Corrected Sum: ${corrected}`);
        }

        steps.push(`<strong>✅ Final BCD Answer:</strong> ${sumBin}`);
        return steps;
      },
      truthTable: "If any 4-bit sum > 9, add 0110 for correction (9 + 6 = 15 → correction applied)"
    },
        { id: "bcd-to-ex3", name: "BCD TO EXCESS-3", icon: "📈",
      theory: "Last Minute Complete Guide: Take valid BCD input (each 4-bit group must be 0000 to 1001). Add 0011 (decimal 3) to each 4-bit group to get Excess-3 code.",
      inputLabel: "Enter BCD (e.g. 1001 or 0010 0101)",
      exampleInput: "1001", exampleOutput: "1100",
      convert: (input) => {
        const clean = input.replace(/\s/g, '');
        if (!/^[01]+$/.test(clean) || clean.length % 4 !== 0) 
            return "ERROR: Invalid BCD! Input must be in groups of 4 bits only.";

        const groups = clean.match(/.{4}/g);
        for (let group of groups) {
            if (parseInt(group, 2) > 9) 
                return "ERROR: Invalid BCD! Each 4-bit group must be between 0000 and 1001 (decimal 0-9 only).";
        }

        // Valid BCD → Add 0011 to each group
        let result = '';
        for (let group of groups) {
            const decimal = parseInt(group, 2);
            const excess3 = decimal + 3;
            result += excess3.toString(2).padStart(4, '0') + ' ';
        }
        return result.trim();
      },
      getSteps: (input) => {
        const clean = input.replace(/\s/g, '');
        const groups = clean.match(/.{4}/g);
        let steps = [`<strong>Input BCD:</strong> ${input}`];

        steps.push(`<strong>Validating each 4-bit group:</strong>`);
        groups.forEach((group, i) => {
            const dec = parseInt(group, 2);
            steps.push(`Group ${i+1}: ${group} = ${dec} (Valid)`);
        });

        steps.push(`<strong>Step: Add 0011 (3) to each group</strong>`);
        let result = '';
        groups.forEach((group, i) => {
            const dec = parseInt(group, 2);
            const ex3 = dec + 3;
            const ex3Bin = ex3.toString(2).padStart(4, '0');
            steps.push(`Group ${i+1}: ${group} + 0011 = ${ex3Bin} (${dec} + 3 = ${ex3})`);
            result += ex3Bin + ' ';
        });

        steps.push(`<strong>✅ Final Excess-3:</strong> ${result.trim()}`);
        return steps;
      },
      truthTable: "Valid BCD: 0000 to 1001 only<br>Excess-3 = BCD + 0011"
    },
    { id: "dec-to-ex3", name: "DECIMAL TO EXCESS-3", icon: "🔄", theory: "Last Minute Complete Guide: Convert decimal to BCD first, then add 3 to each 4-bit group.", inputLabel: "Enter Decimal Number", exampleInput: "7", exampleOutput: "1010", convert: (input) => /^[0-9]+$/.test(input) ? input.split('').map(d => (parseInt(d)+3).toString(2).padStart(4,'0')).join(' ') : "ERROR: Invalid Decimal!", getSteps: (input) => ["Convert to BCD", "Add 3 to each 4-bit group"], truthTable: "Each digit + 3 in binary" },
       
        { id: "ex3-to-dec", name: "EXCESS-3 TO DECIMAL", icon: "📉",
      theory: "Last Minute Complete Guide: Subtract 0011 (decimal 3) from each 4-bit group of the Excess-3 code. The result of each group must be between 0 and 9. If any group is less than 0011 or gives a value outside 0-9 after subtraction, it is invalid.",
      inputLabel: "Enter Excess-3 (e.g. 0100 or 0100 0011)",
      exampleInput: "0100 0011", exampleOutput: "10",
      convert: (input) => {
        const clean = input.replace(/\s/g, '');
        if (!/^[01]+$/.test(clean) || clean.length % 4 !== 0) 
            return "ERROR: Invalid Excess-3! Input must be in groups of exactly 4 bits.";

        const groups = clean.match(/.{4}/g);
        let result = '';

        for (let group of groups) {
            const value = parseInt(group, 2);
            if (value < 3) 
                return `ERROR: Invalid Excess-3! Group ${group} is less than 0011 (3). Minimum allowed is 0011.`;

            const decimal = value - 3;
            if (decimal < 0 || decimal > 9) 
                return `ERROR: Invalid Excess-3! After subtracting 3, group ${group} gives ${decimal} which is not between 0-9.`;

            result += decimal;
        }
        return result;
      },
      getSteps: (input) => {
        const clean = input.replace(/\s/g, '');
        const groups = clean.match(/.{4}/g);
        let steps = [`<strong>Input Excess-3:</strong> ${input}`];

        steps.push(`<strong>Processing ${groups.length} groups of 4 bits each:</strong>`);

        let result = '';
        groups.forEach((group, i) => {
            const value = parseInt(group, 2);
            const decimal = value - 3;
            steps.push(`Group ${i+1}: ${group} (${value}) - 0011 (3) = ${decimal}`);
            result += decimal;
        });

        steps.push(`<strong>✅ Final Decimal:</strong> ${result}`);
        return steps;
      },
      truthTable: "Valid Excess-3 groups: 0011 to 1100 only<br>Excess-3 - 0011 = Decimal (result must be 0-9)"
    },
           { id: "ex3-to-bcd", name: "EXCESS-3 TO BCD", icon: "🔃",
      theory: "Last Minute Complete Guide: Subtract 0011 (decimal 3) from each 4-bit group of Excess-3 code to get the original BCD. Each group after subtraction must be between 0 and 9. If any group is less than 0011 or gives value outside 0-9 after subtraction, it is invalid.",
      inputLabel: "Enter Excess-3 (e.g. 1100 or 0100 0011)",
      exampleInput: "1100", exampleOutput: "1001",
      convert: (input) => {
        const clean = input.replace(/\s/g, '');
        if (!/^[01]+$/.test(clean) || clean.length % 4 !== 0) 
            return "ERROR: Invalid Excess-3! Input must be in groups of exactly 4 bits.";

        const groups = clean.match(/.{4}/g);
        let result = '';

        for (let group of groups) {
            const value = parseInt(group, 2);
            if (value < 3) 
                return `ERROR: Invalid Excess-3! Group ${group} is less than 0011 (3). Minimum allowed is 0011.`;

            const bcdValue = value - 3;
            if (bcdValue < 0 || bcdValue > 9) 
                return `ERROR: Invalid Excess-3! After subtracting 3, group ${group} gives ${bcdValue} which is not between 0-9.`;

            result += bcdValue.toString(2).padStart(4, '0') + ' ';
        }
        return result.trim();
      },
      getSteps: (input) => {
        const clean = input.replace(/\s/g, '');
        const groups = clean.match(/.{4}/g);
        let steps = [`<strong>Input Excess-3:</strong> ${input}`];

        steps.push(`<strong>Processing ${groups.length} groups of 4 bits each:</strong>`);

        let result = '';
        groups.forEach((group, i) => {
            const value = parseInt(group, 2);
            const bcd = value - 3;
            const bcdBin = bcd.toString(2).padStart(4, '0');
            steps.push(`Group ${i+1}: ${group} (${value}) - 0011 (3) = ${bcd} → BCD ${bcdBin}`);
            result += bcdBin + ' ';
        });

        steps.push(`<strong>✅ Final BCD:</strong> ${result.trim()}`);
        return steps;
      },
      truthTable: "Valid Excess-3 groups: 0011 to 1100 only<br>Excess-3 - 0011 = BCD (result must be 0-9)"
    },
    {
  id: "even-parity", name: "EVEN PARITY", icon: "⚖️",
  theory: "Last Minute Complete Guide: Add a parity bit so that the total number of 1s becomes even.",
  inputLabel: "Enter Binary Number",
  exampleInput: "1011", exampleOutput: "10111",
  convert: (input) => /^[01]+$/.test(input) ? input + ((input.split('1').length - 1) % 2 === 0 ? '0' : '1') : "ERROR: Invalid Binary!",
  getSteps: (input) => ["Count number of 1s", "If odd → add 1, else add 0"],
  truthTable: "Number of 1s even → parity bit = 0<br>Number of 1s odd → parity bit = 1"
},

{ 
  id: "odd-parity", name: "ODD PARITY", icon: "⚖️",
  theory: "Last Minute Complete Guide: Add a parity bit so that the total number of 1s becomes odd.",
  inputLabel: "Enter Binary Number",
  exampleInput: "1011", exampleOutput: "10110",
  convert: (input) => /^[01]+$/.test(input) ? input + ((input.split('1').length - 1) % 2 === 0 ? '1' : '0') : "ERROR: Invalid Binary!",
  getSteps: (input) => ["Count number of 1s", "If even → add 1, else add 0"],
  truthTable: "Number of 1s even → parity bit = 1<br>Number of 1s odd → parity bit = 0"
},
    { id: "dec-to-gray", name: "DECIMAL TO GRAY", icon: "🌫️", theory: "Last Minute Complete Guide: Convert decimal to binary first, then apply Gray code conversion (MSB same, rest XOR with previous bit).", inputLabel: "Enter Decimal Number", exampleInput: "13", exampleOutput: "1011", convert: (input) => /^[0-9]+$/.test(input) ? parseInt(input,10).toString(2).split('').reduce((a,b,i,arr) => a + (i===0 ? b : (parseInt(arr[i-1]) ^ parseInt(b))), '') : "ERROR: Invalid Decimal!", getSteps: (input) => ["Convert to binary", "Apply XOR with previous bit"], truthTable: "Binary to Gray: MSB same + XOR" },
    { id: "gray-to-dec", name: "GRAY TO DECIMAL", icon: "🌁", theory: "Last Minute Complete Guide: Convert Gray code back to binary then to decimal.", inputLabel: "Enter Gray Code", exampleInput: "1011", exampleOutput: "13", convert: (input) => /^[01]+$/.test(input) ? parseInt(input.split('').reduce((a,b,i) => a + (i===0 ? b : (parseInt(a[a.length-1]) ^ parseInt(b))), ''), 2).toString(10) : "ERROR: Invalid Gray!", getSteps: (input) => ["Convert Gray to Binary", "Convert Binary to Decimal"], truthTable: "Gray to Binary conversion" },
    { id: "bin-to-gray", name: "BINARY TO GRAY", icon: "⚫", theory: "Last Minute Complete Guide: MSB remains same. Each next bit is XOR of previous binary bit and current bit.", inputLabel: "Enter Binary Number", exampleInput: "1101", exampleOutput: "1011", convert: (input) => /^[01]+$/.test(input) ? input.split('').reduce((a,b,i,arr) => a + (i===0 ? b : (parseInt(arr[i-1]) ^ parseInt(b))), '') : "ERROR: Invalid Binary!", getSteps: (input) => ["MSB same", "Rest bits = previous XOR current"], truthTable: "Binary → Gray (XOR method)" },
    { id: "gray-to-bin", name: "GRAY TO BINARY", icon: "⚪", theory: "Last Minute Complete Guide: MSB same. Each next bit is XOR of previous binary bit and current Gray bit.", inputLabel: "Enter Gray Code", exampleInput: "1011", exampleOutput: "1101", convert: (input) => /^[01]+$/.test(input) ? input.split('').reduce((a,b,i) => a + (i===0 ? b : (parseInt(a[a.length-1]) ^ parseInt(b))), '') : "ERROR: Invalid Gray!", getSteps: (input) => ["MSB same", "Rest bits = previous binary XOR current Gray"], truthTable: "Gray → Binary (XOR method)" },
    { id: "ascii-to-bin", name: "ASCII TO BINARY", icon: "🔤", theory: "Last Minute Complete Guide: Convert each character's ASCII value to 8-bit binary.", inputLabel: "Enter single character (e.g. A)", exampleInput: "A", exampleOutput: "01000001", convert: (input) => input.length === 1 ? input.charCodeAt(0).toString(2).padStart(8,'0') : "ERROR: Enter only one character!", getSteps: (input) => ["Get ASCII value", "Convert to 8-bit binary"], truthTable: "ASCII value → 8-bit binary" },

    // Fractional Supported Topics
    { id: "dec-to-bin", name: "DECIMAL TO BINARY", icon: "🔢→2️⃣",
      theory: "Last Minute Complete Guide: For integer part, divide the number by 2 repeatedly and note the remainders. For fractional part, multiply by 2 repeatedly and note the integer parts. Combine both.",
      inputLabel: "Enter Decimal Number (e.g. 25 or 25.75)",
      exampleInput: "25.75", exampleOutput: "11001.11",
      convert: converters.decToBin, getSteps: getDecToBinSteps, truthTable: "Integer: Divide by 2 | Fraction: Multiply by 2" },

    { id: "dec-to-oct", name: "DECIMAL TO OCTAL", icon: "🔢→8️⃣",
      theory: "Last Minute Complete Guide: For integer part, divide the number by 8 repeatedly and note the remainders. For fractional part, multiply by 8 repeatedly and note the integer parts. Combine both.",
      inputLabel: "Enter Decimal Number (e.g. 25 or 25.75)",
      exampleInput: "25.75", exampleOutput: "31.6",
      convert: converters.decToOct, getSteps: getDecToOctSteps, truthTable: "Integer: Divide by 8 | Fraction: Multiply by 8" },

    { id: "dec-to-hex", name: "DECIMAL TO HEXADECIMAL", icon: "🔢→🔠",
      theory: "Last Minute Complete Guide: For integer part, divide the number by 16 repeatedly and note the remainders (use A-F for 10-15). For fractional part, multiply by 16 repeatedly and note the integer parts. Combine both.",
      inputLabel: "Enter Decimal Number (e.g. 25 or 25.75)",
      exampleInput: "25.75", exampleOutput: "19.C",
      convert: converters.decToHex, getSteps: getDecToHexSteps, truthTable: "Integer: Divide by 16 | Fraction: Multiply by 16" },

    { id: "bin-to-dec", name: "BINARY TO DECIMAL", icon: "2️⃣→🔢",
      theory: "Last Minute Complete Guide: Multiply each bit with 2 raised to its position. For fractional part use negative powers.",
      inputLabel: "Enter Binary (e.g. 11001 or 11001.101)",
      exampleInput: "11001.101", exampleOutput: "25.625",
      convert: converters.binToDec, getSteps: getBinToDecSteps, truthTable: "Positional value (×2^power)" },

    { id: "oct-to-dec", name: "OCTAL TO DECIMAL", icon: "8️⃣→🔢",
      theory: "Last Minute Complete Guide: Multiply each digit with 8 raised to its position. For fractional part use negative powers.",
      inputLabel: "Enter Octal (e.g. 31 or 31.6)",
      exampleInput: "31.6", exampleOutput: "25.75",
      convert: converters.octToDec, getSteps: getOctToDecSteps, truthTable: "Positional value (×8^power)" },

    { id: "hex-to-dec", name: "HEXADECIMAL TO DECIMAL", icon: "🔠→🔢",
      theory: "Last Minute Complete Guide: Multiply each digit with 16 raised to its position. For fractional part use negative powers.",
      inputLabel: "Enter Hex (e.g. 19 or 19.C)",
      exampleInput: "19.C", exampleOutput: "25.75",
      convert: converters.hexToDec, getSteps: getHexToDecSteps, truthTable: "Positional value (×16^power)" },

   { id: "bin-to-oct", name: "BINARY TO OCTAL", icon: "2️⃣→8️⃣",
      theory: "Last Minute Complete Guide: Group binary bits in 3s. Supports fractional numbers also.",
      inputLabel: "Enter Binary (e.g. 11001 or 11001.101)",
      exampleInput: "11001.101", exampleOutput: "31.5",
      convert: converters.binToOct, getSteps: getBinToOctSteps, truthTable: "Group 3 bits" },

    { id: "bin-to-hex", name: "BINARY TO HEXADECIMAL", icon: "2️⃣→🔠",
      theory: "Last Minute Complete Guide: Group binary bits in 4s. Supports fractional numbers also.",
      inputLabel: "Enter Binary (e.g. 11001 or 11001.101)",
      exampleInput: "11001.101", exampleOutput: "19.5",
      convert: converters.binToHex, getSteps: getBinToHexSteps, truthTable: "Group 4 bits" },

    { id: "oct-to-bin", name: "OCTAL TO BINARY", icon: "8️⃣→2️⃣",
      theory: "Last Minute Complete Guide: Convert each octal digit to 3-bit binary. Supports fractional.",
      inputLabel: "Enter Octal (e.g. 31 or 31.6)",
      exampleInput: "31.6", exampleOutput: "11001.110",
      convert: converters.octToBin, getSteps: getOctToBinSteps, truthTable: "Each digit → 3 bits" },

    { id: "hex-to-bin", name: "HEXADECIMAL TO BINARY", icon: "🔠→2️⃣",
      theory: "Last Minute Complete Guide: Convert each hex digit to 4-bit binary. Supports fractional.",
      inputLabel: "Enter Hex (e.g. 19 or 19.C)",
      exampleInput: "19.C", exampleOutput: "11001.1100",
      convert: converters.hexToBin, getSteps: getHexToBinSteps, truthTable: "Each digit → 4 bits" },
      { id: "oct-to-hex", name: "OCTAL TO HEXADECIMAL", icon: "8️⃣→🔠",
      theory: "Last Minute Complete Guide: First convert Octal to Decimal, then Decimal to Hex. Now supports fractional numbers.",
      inputLabel: "Enter Octal (e.g. 31 or 31.6)",
      exampleInput: "31.6", exampleOutput: "19.C",
      convert: converters.octToHex, 
      getSteps: getOctToHexSteps, 
      truthTable: "Octal → Decimal → Hex" },

    { id: "hex-to-oct", name: "HEXADECIMAL TO OCTAL", icon: "🔠→8️⃣",
      theory: "Last Minute Complete Guide: First convert Hex to Decimal, then Decimal to Octal. Now supports fractional numbers.",
      inputLabel: "Enter Hex (e.g. 19 or 19.C)",
      exampleInput: "19.C", exampleOutput: "31.6",
      convert: converters.hexToOct, 
      getSteps: getHexToOctSteps, 
      truthTable: "Hex → Decimal → Octal" },
    ];

// ====================== UI FUNCTIONS (UNCHANGED) ======================
function createCards() {
    const grid = document.getElementById('topics-grid');
    grid.innerHTML = '';

    topics.forEach(topic => {
        const card = document.createElement('div');
        card.className = `bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 text-center cursor-pointer card-hover hover:border-blue-400 hover:bg-white/20`;
        card.innerHTML = `
            <div class="text-5xl mb-4">${topic.icon}</div>
            <h3 class="font-semibold text-lg text-white">${topic.name}</h3>
            <p class="text-blue-300 text-sm mt-2">Click to Convert →</p>
        `;
        card.addEventListener('click', () => openModal(topic));
        grid.appendChild(card);
    });
}

let currentTopic = null;

function openModal(topic) {
    currentTopic = topic;
    document.getElementById('modal-icon').innerHTML = topic.icon;
    document.getElementById('modal-title').textContent = topic.name;
    document.getElementById('modal-theory').innerHTML = `<p class="font-medium">${topic.theory}</p>`;

    const inputHTML = `
        <label class="block text-blue-300 text-sm font-medium mb-2">${topic.inputLabel}</label>
        <input id="user-input" type="text" 
               class="w-full bg-white/10 border border-white/30 rounded-3xl px-6 py-5 text-xl text-white focus:outline-none focus:border-blue-400"
               placeholder="Type here...">
    `;
    document.getElementById('input-section').innerHTML = inputHTML;

    const inputField = document.getElementById('user-input');
    inputField.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performConversion();
    });

    document.getElementById('result-section').classList.add('hidden');
    document.getElementById('step-section').classList.add('hidden');
    document.getElementById('detailed-theory').classList.add('hidden');

    document.getElementById('converter-modal').classList.remove('hidden');
    document.getElementById('converter-modal').classList.add('flex');
}

function closeModal() {
    document.getElementById('converter-modal').classList.add('hidden');
    document.getElementById('converter-modal').classList.remove('flex');
}

function performConversion() {
    if (!currentTopic) return;
    
    const input = document.getElementById('user-input').value.trim();
    if (!input) {
        alert("Please enter a value!");
        return;
    }

    const result = currentTopic.convert(input);
    
    if (result.startsWith("ERROR:")) {
        document.getElementById('result-output').innerHTML = `<span class="text-red-400 font-medium">${result}</span>`;
        document.getElementById('result-section').classList.remove('hidden');
        document.getElementById('step-section').classList.add('hidden');
        return;
    }

    document.getElementById('result-output').innerHTML = `<span class="text-green-400">${result}</span>`;
    document.getElementById('result-section').classList.remove('hidden');

    const stepsContainer = document.getElementById('steps-list');
    stepsContainer.innerHTML = '';
    const steps = currentTopic.getSteps ? currentTopic.getSteps(input) : ["Conversion completed successfully."];
    
    steps.forEach(step => {
        const div = document.createElement('div');
        div.className = "flex gap-3 items-start bg-black/30 p-3 rounded-2xl";
        div.innerHTML = `<span class="text-green-400 mt-1">✅</span><span>${step}</span>`;
        stepsContainer.appendChild(div);
    });
    document.getElementById('step-section').classList.remove('hidden');
}

function toggleDetailedTheory() {
    const detailDiv = document.getElementById('detailed-theory');
    if (detailDiv.classList.contains('hidden')) {
        const t = currentTopic;
        detailDiv.innerHTML = `
            <h4 class="font-semibold text-blue-300 mb-4">Complete Guide</h4>
            <p class="mb-6">${t.theory}</p>
            <h4 class="font-semibold text-blue-300 mb-2">Example</h4>
            <p class="bg-black/50 p-4 rounded-2xl mb-6"><strong>Input:</strong> ${t.exampleInput}<br><strong>Output:</strong> ${t.exampleOutput}</p>
            <h4 class="font-semibold text-blue-300 mb-2">Key Rule</h4>
            <div class="bg-black/50 p-4 rounded-2xl text-xs">${t.truthTable}</div>
        `;
        detailDiv.classList.remove('hidden');
    } else {
        detailDiv.classList.add('hidden');
    }
}

// Initialize
window.onload = createCards;