/**
 * FormulaEvaluator - Manages the evaluation of formulas within custom <formula> elements
 */
class FormulaEvaluator {
  constructor() {
    this.formulaCache = [];
    this._bindEvents();
  }

  _bindEvents() {
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this._setup());
    } else {
      this._setup();
    }
  }

  _setup() {
    // Grab all formula tags from the page
    const tags = document.querySelectorAll('formula');
    if (!tags.length) return;
    
    // Process each formula tag
    tags.forEach(tag => {
      const expr = tag.getAttribute('evaluator');
      if (!expr) return;
      
      // Keep track of formulas we need to process
      this.formulaCache.push({
        el: tag,
        expr: expr,
      });
      
      // Figure out which input fields are needed for this formula
      const fields = this._parseFields(expr);
      
      // Set up change listeners
      fields.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
          field.addEventListener('input', () => this._updateResults());
        }
      });
    });
    
    // Calculate initial values
    this._updateResults();
  }

  _parseFields(expr) {
    // Extract possible field IDs from the expression
    const matches = expr.match(/[a-zA-Z][a-zA-Z0-9_]*/g) || [];
    
    // Filter out JavaScript keywords and math functions
    const jsStuff = [
      'Math', 'parseInt', 'parseFloat', 'Number', 
      'String', 'if', 'else', 'for', 'while', 'function',
      'return', 'true', 'false', 'null', 'undefined', 
      'const', 'let', 'var', 'sin', 'cos', 'tan', 'PI',
      'toFixed', 'valueOf', 'toString'
    ];
    
    return matches.filter(id => !jsStuff.includes(id));
  }

  _updateResults() {
    this.formulaCache.forEach(item => {
      this._calculate(item.el, item.expr);
    });
  }

  _calculate(el, expr) {
    try {
      // Get field IDs for this expression
      const fields = this._parseFields(expr);
      
      // Build the function body
      let funcBody = 'try {';
      
      // Add each input field's value
      fields.forEach(id => {
        const input = document.getElementById(id);
        const val = input ? parseFloat(input.value) || 0 : 0;
        funcBody += `const ${id} = ${val};\n`;
      });
      
      // Add the expression evaluation
      funcBody += `return ${expr};\n`;
      funcBody += '} catch (e) { return "Invalid Formula"; }';
      
      // Create and run the evaluation function
      const func = new Function(funcBody);
      const answer = func();
      
      // Update the formula tag
      el.textContent = isNaN(answer) ? "Invalid Formula" : answer;
    } catch (err) {
      // Just show error state if anything goes wrong
      el.textContent = "Invalid Formula";
    }
  }
}

// Start it up
new FormulaEvaluator(); 