class CraftGame {
    constructor() {
        this.elements = new Map();
        this.recipes = new Map();
        this.discovered = new Set();
        this.pendingCombinations = new Map();
        
        // Load saved discoveries from localStorage
        this.loadSavedState();
        
        // Initialize basic elements if no saved state
        if (this.discovered.size === 0) {
            this.addElement('Water', '💧');
            this.addElement('Fire', '🔥');
            this.addElement('Earth', '🌍');
            this.addElement('Air', '💨');
        }

        // Initialize UI elements
        this.initializeUI();
        this.updateElementList();
    }

    loadSavedState() {
        const savedElements = localStorage.getItem('craftElements');
        const savedRecipes = localStorage.getItem('craftRecipes');
        const savedDiscovered = localStorage.getItem('craftDiscovered');
        
        if (savedElements) {
            this.elements = new Map(JSON.parse(savedElements));
        }
        if (savedRecipes) {
            this.recipes = new Map(JSON.parse(savedRecipes));
        }
        if (savedDiscovered) {
            this.discovered = new Set(JSON.parse(savedDiscovered));
        }
    }

    saveState() {
        localStorage.setItem('craftElements', JSON.stringify([...this.elements]));
        localStorage.setItem('craftRecipes', JSON.stringify([...this.recipes]));
        localStorage.setItem('craftDiscovered', JSON.stringify([...this.discovered]));
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
}

// Initialize game when the page loads
window.addEventListener('load', () => {
    window.craftGame = new CraftGame();
});
