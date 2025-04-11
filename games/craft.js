class CraftGame {
    constructor() {
        this.elements = new Map();
        this.recipes = new Map();
        this.discovered = new Set();
        
        // Initialize basic elements
        this.addElement('Water', '💧');
        this.addElement('Fire', '🔥');
        this.addElement('Earth', '🌍');
        this.addElement('Air', '💨');

        // Initialize basic recipes
        this.addRecipe('Water', 'Earth', 'Plant', '🌱');
        this.addRecipe('Fire', 'Earth', 'Lava', '🌋');
        this.addRecipe('Water', 'Air', 'Cloud', '☁️');
        this.addRecipe('Fire', 'Air', 'Smoke', '💨');
        this.addRecipe('Plant', 'Water', 'Tree', '🌳');
        this.addRecipe('Cloud', 'Water', 'Rain', '🌧️');
        this.addRecipe('Lava', 'Water', 'Stone', '🪨');
        this.addRecipe('Plant', 'Fire', 'Ash', '🌫️');
        this.addRecipe('Tree', 'Fire', 'Wood', '🪵');
        this.addRecipe('Stone', 'Fire', 'Metal', '⚒️');
        this.addRecipe('Metal', 'Fire', 'Tool', '🔨');
        this.addRecipe('Tool', 'Wood', 'Axe', '🪓');
        this.addRecipe('Tool', 'Stone', 'Sword', '⚔️');
        this.addRecipe('Cloud', 'Fire', 'Lightning', '⚡');
        this.addRecipe('Lightning', 'Earth', 'Energy', '✨');
        this.addRecipe('Energy', 'Metal', 'Electronics', '💻');
        this.addRecipe('Water', 'Fire', 'Steam', '♨️');
        this.addRecipe('Steam', 'Metal', 'Engine', '🔧');
        this.addRecipe('Engine', 'Metal', 'Robot', '🤖');
        this.addRecipe('Electronics', 'Energy', 'AI', '🧠');

        // Initialize UI elements
        this.initializeUI();
        this.updateElementList();
    }

    addElement(name, emoji) {
        this.elements.set(name, emoji);
        this.discovered.add(name);
    }

    addRecipe(elem1, elem2, result, emoji) {
        const key = this.getRecipeKey(elem1, elem2);
        this.recipes.set(key, { result, emoji });
        this.elements.set(result, emoji);
    }

    getRecipeKey(elem1, elem2) {
        return [elem1, elem2].sort().join('_');
    }

    combine(elem1, elem2) {
        const key = this.getRecipeKey(elem1, elem2);
        const recipe = this.recipes.get(key);
        
        if (recipe) {
            const { result, emoji } = recipe;
            if (!this.discovered.has(result)) {
                this.discovered.add(result);
                this.updateElementList();
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

        this.workspace.addEventListener('drop', (e) => {
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
                    
                    // Try to combine
                    const result = this.combine(elem1, elem2);
                    if (result.success) {
                        this.showResult(result);
                    }
                }
            }
        });
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
