class CraftGame {
    constructor() {
        this.version = '1.0.0'; // Add version tracking
        this.elements = new Map();
        this.recipes = new Map();
        this.discovered = new Set();
        this.pendingCombinations = new Map();
        
        // Load saved state first
        this.loadSavedState();
        
        // Add basic elements without overwriting existing ones
        this.ensureBasicElements();
        
        // Initialize UI elements
        this.initializeUI();
        this.updateElementList();
        
        // Auto-save periodically
        setInterval(() => this.saveState(), 5000);
    }

    ensureBasicElements() {
        const basicElements = [
            ['Water', '💧'],
            ['Fire', '🔥'],
            ['Earth', '🌍'],
            ['Air', '💨']
        ];
        
        basicElements.forEach(([name, emoji]) => {
            if (!this.elements.has(name)) {
                this.addElement(name, emoji);
            }
        });
    }

    loadSavedState() {
        try {
            // Load saved data
            const savedData = localStorage.getItem('craftGameData');
            if (savedData) {
                const data = JSON.parse(savedData);
                
                // Version check for future compatibility
                if (data.version === this.version) {
                    this.elements = new Map(data.elements);
                    this.recipes = new Map(data.recipes);
                    this.discovered = new Set(data.discovered);
                } else {
                    // Handle version mismatch - preserve user data
                    console.log('Version mismatch - migrating data');
                    this.migrateData(data);
                }
            }
        } catch (error) {
            console.error('Error loading saved state:', error);
            // Create backup of corrupted data
            const timestamp = new Date().toISOString();
            localStorage.setItem(`craftGameData_backup_${timestamp}`, localStorage.getItem('craftGameData'));
            
            // Reset to default state
            this.resetToDefault();
        }
    }

    migrateData(oldData) {
        // Preserve existing discoveries and recipes
        if (oldData.elements) {
            this.elements = new Map(oldData.elements);
        }
        if (oldData.recipes) {
            this.recipes = new Map(oldData.recipes);
        }
        if (oldData.discovered) {
            this.discovered = new Set(oldData.discovered);
        }
    }

    resetToDefault() {
        this.elements = new Map();
        this.recipes = new Map();
        this.discovered = new Set();
        this.ensureBasicElements();
    }

    saveState() {
        try {
            const data = {
                version: this.version,
                elements: [...this.elements],
                recipes: [...this.recipes],
                discovered: [...this.discovered]
            };
            
            // Create backup before saving
            const currentData = localStorage.getItem('craftGameData');
            if (currentData) {
                localStorage.setItem('craftGameData_backup', currentData);
            }
            
            // Save new state
            localStorage.setItem('craftGameData', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }

    addElement(name, emoji) {
        this.elements.set(name, emoji);
        this.discovered.add(name);
        this.saveState();
    }

    addRecipe(elem1, elem2, result, emoji) {
        const key = this.getRecipeKey(elem1, elem2);
        this.recipes.set(key, { result, emoji });
        this.elements.set(result, emoji);
        this.saveState();
    }

    getRecipeKey(elem1, elem2) {
        return [elem1, elem2].sort().join('_');
    }

    async generateCombination(elem1, elem2) {
        const key = this.getRecipeKey(elem1, elem2);
        
        // Check if we've already tried this combination
        if (this.pendingCombinations.has(key)) {
            return this.pendingCombinations.get(key);
        }

        // Check if we already have this recipe
        if (this.recipes.has(key)) {
            return this.recipes.get(key);
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [{
                        role: "system",
                        content: "You are a creative combination generator for an Infinite Craft style game. Given two elements, generate a logical combination result and an appropriate emoji. Respond in JSON format only with {result: string, emoji: string}."
                    }, {
                        role: "user",
                        content: `Combine these elements: ${elem1} and ${elem2}`
                    }]
                })
            });

            const data = await response.json();
            const combination = JSON.parse(data.choices[0].message.content);
            
            // Store the new recipe
            this.addRecipe(elem1, elem2, combination.result, combination.emoji);
            
            return { result: combination.result, emoji: combination.emoji };
        } catch (error) {
            console.error('Error generating combination:', error);
            
            // Generate a fallback combination if API fails
            const fallbackResult = `${elem1}${elem2}`;
            const fallbackEmoji = '❓';
            
            this.addRecipe(elem1, elem2, fallbackResult, fallbackEmoji);
            return { result: fallbackResult, emoji: fallbackEmoji };
        }
    }

    async combine(elem1, elem2) {
        const key = this.getRecipeKey(elem1, elem2);
        let recipe = this.recipes.get(key);
        
        if (!recipe) {
            // Generate new combination using AI
            recipe = await this.generateCombination(elem1, elem2);
        }
        
        if (recipe) {
            const { result, emoji } = recipe;
            if (!this.discovered.has(result)) {
                this.discovered.add(result);
                this.updateElementList();
                this.saveState();
                return { success: true, result, emoji, isNew: true };
            }
            return { success: true, result, emoji, isNew: false };
        }
        
        return { success: false };
    }

    initializeUI() {
        this.workspace = document.getElementById('craftWorkspace');
        this.elementsList = document.getElementById('elementsList');
        this.discoveredCount = document.getElementById('discoveredCount');
        
        // Setup drag and drop
        this.workspace.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        this.workspace.addEventListener('drop', async (e) => {
            e.preventDefault();
            const draggedElement = document.querySelector('.dragging');
            if (draggedElement) {
                draggedElement.classList.remove('dragging');
                
                const elements = document.querySelectorAll('#craftWorkspace .element');
                if (elements.length >= 2) {
                    const elem1 = elements[0].dataset.name;
                    const elem2 = elements[1].dataset.name;
                    
                    // Remove the elements
                    elements.forEach(el => el.remove());
                    
                    // Show loading state
                    this.showLoadingState();
                    
                    // Try to combine
                    const result = await this.combine(elem1, elem2);
                    
                    // Hide loading state
                    this.hideLoadingState();
                    
                    if (result.success) {
                        this.showResult(result);
                    }
                }
            }
        });
    }

    showLoadingState() {
        const loading = document.createElement('div');
        loading.className = 'loading-state';
        loading.innerHTML = '🔮 Generating...';
        this.workspace.appendChild(loading);
    }

    hideLoadingState() {
        const loading = this.workspace.querySelector('.loading-state');
        if (loading) {
            loading.remove();
        }
    }

    createElementDiv(name, emoji) {
        const div = document.createElement('div');
        div.className = 'element';
        div.innerHTML = `${emoji}<br>${name}`;
        div.dataset.name = name;
        div.draggable = true;

        div.addEventListener('dragstart', () => {
            div.classList.add('dragging');
            const workspace = document.getElementById('craftWorkspace');
            const clone = div.cloneNode(true);
            workspace.appendChild(clone);
        });

        div.addEventListener('dragend', () => {
            div.classList.remove('dragging');
        });

        return div;
    }

    updateElementList() {
        this.elementsList.innerHTML = '';
        Array.from(this.discovered)
            .sort()
            .forEach(name => {
                const emoji = this.elements.get(name);
                const div = this.createElementDiv(name, emoji);
                this.elementsList.appendChild(div);
            });
        
        this.discoveredCount.textContent = `Discovered: ${this.discovered.size}/${this.elements.size}`;
    }

    showResult(result) {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'element result';
        resultDiv.innerHTML = `${result.emoji}<br>${result.result}`;
        
        if (result.isNew) {
            resultDiv.classList.add('new-discovery');
            this.showDiscoveryMessage(result.result);
        }
        
        this.workspace.appendChild(resultDiv);
        
        setTimeout(() => {
            resultDiv.remove();
        }, 2000);
    }

    showDiscoveryMessage(element) {
        const message = document.createElement('div');
        message.className = 'discovery-message';
        message.textContent = `New Discovery: ${element}!`;
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    exportData() {
        try {
            const data = {
                version: this.version,
                elements: [...this.elements],
                recipes: [...this.recipes],
                discovered: [...this.discovered],
                exportDate: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `infinite-craft-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showMessage('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showMessage('Error exporting data', 'error');
        }
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Validate data structure
                    if (!data.version || !data.elements || !data.recipes || !data.discovered) {
                        throw new Error('Invalid data format');
                    }
                    
                    // Create backup before import
                    this.saveState();
                    localStorage.setItem('craftGameData_pre_import', localStorage.getItem('craftGameData'));
                    
                    // Import data
                    this.elements = new Map(data.elements);
                    this.recipes = new Map(data.recipes);
                    this.discovered = new Set(data.discovered);
                    
                    // Ensure basic elements exist
                    this.ensureBasicElements();
                    
                    // Save and update UI
                    this.saveState();
                    this.updateElementList();
                    
                    this.showMessage('Data imported successfully!', 'success');
                } catch (error) {
                    console.error('Error importing data:', error);
                    this.showMessage('Error importing data: Invalid file format', 'error');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    showMessage(text, type = 'info') {
        const message = document.createElement('div');
        message.className = `discovery-message ${type}`;
        message.textContent = text;
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 3000);
    }
}

// Initialize game when the page loads
window.addEventListener('load', () => {
    window.craftGame = new CraftGame();
});
