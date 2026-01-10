class CraftGame {
    constructor() {
        // Initialize fresh state
        this.elements = new Map();
        this.recipes = new Map();
        this.discovered = new Set();
        this.pendingCombinations = new Map();

        // Try to load saved state first
        if (!this.loadSavedState()) {
            // If no saved state, initialize with basic elements
            this.initializeBasicElements();
        }

        // Initialize UI
        this.initializeUI();
        this.updateElementList();

        // Auto-save periodically
        setInterval(() => this.saveState(), 5000);
    }

    saveState() {
        try {
            const data = {
                elements: Array.from(this.elements.entries()),
                recipes: Array.from(this.recipes.entries()),
                discovered: Array.from(this.discovered)
            };
            localStorage.setItem('craftGameData', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }

    loadSavedState() {
        try {
            const savedData = localStorage.getItem('craftGameData');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.elements = new Map(data.elements);
                this.recipes = new Map(data.recipes);
                this.discovered = new Set(data.discovered);
                return true;
            }
        } catch (error) {
            console.error('Error loading saved state:', error);
        }
        return false;
    }

    initializeBasicElements() {
        // Add ALL possible elements first
        const allElements = [
            ['Water', '💧'], ['Fire', '🔥'], ['Earth', '🌍'], ['Air', '💨'],
            ['Steam', '♨️'], ['Mud', '💩'], ['Lava', '🌋'], ['Cloud', '☁️'],
            ['Energy', '⚡'], ['Dust', '💨'], ['Lake', '💧'], ['Inferno', '🔥'],
            ['Mountain', '⛰️'], ['Sky', '🌤️'], ['Pressure', '💨'], ['Smoke', '💨'],
            ['Geyser', '♨️'], ['Rain', '🌧️'], ['Brick', '🧱'], ['Swamp', '🥬'],
            ['Clay', '🏺'], ['Pottery', '🏺'], ['Stone', '🪨'], ['Magma', '🌋'],
            ['Obsidian', '🖤'], ['Lightning', '⚡'], ['Wind', '💨'], ['Storm', '⛈️'],
            ['Wave', '🌊'], ['Plasma', '🌟'], ['Life', '🌱'], ['Thunder', '🌩️'],
            ['Sand', '🏖️'], ['Haze', '🌫️'], ['Mineral', '💎'], ['Rainbow', '🌈'],
            ['Metal', '⚙️'], ['Island', '🏝️'], ['Mist', '🌫️'], ['Waterfall', '🌊'],
            ['Volcano', '🌋'], ['Wildfire', '🔥'], ['Eruption', '🌋'], ['River', '🌊'],
            ['Peak', '🗻'], ['Sun', '☀️'], ['Horizon', '🌅'], ['Weather', '🌤️'],
            ['Snow', '❄️'], ['Ice', '🧊'], ['Glacier', '🧊'], ['Fog', '🌫️'],
            ['Plant', '🌱'], ['Tree', '🌳'], ['Forest', '🌲'], ['Jungle', '🌴'],
            ['Flower', '🌸'], ['Pollen', '✨'], ['Fruit', '🍎'], ['Diamond', '💎'],
            ['Stars', '✨'], ['Galaxy', '🌌'], ['Universe', '🌌'], ['Moon', '🌙'],
            ['Animal', '🦁'], ['Fish', '🐟'], ['Bird', '🦅'], ['Human', '👤'],
            ['Tool', '🔧'], ['Wood', '🪵'], ['Weapon', '⚔️'], ['Family', '👨‍👩‍👦'],
            ['Village', '🏘️'], ['City', '🌆'], ['Metropolis', '🌃'], ['Machine', '⚙️'],
            ['Computer', '💻'], ['AI', '🤖'], ['Electricity', '⚡'], ['Car', '🚗'],
            ['Plane', '✈️'], ['Rocket', '🚀'], ['Science', '🔬'], ['Art', '🎨'],
            ['Music', '🎵'], ['Love', '❤️'], ['Peace', '☮️'], ['War', '⚔️'],
            ['Death', '💀'], ['Ghost', '👻'], ['Angel', '👼'], ['Space', '🌌'],
            ['Time', '⌛'], ['Dragon', '🐉'], ['Unicorn', '🦄'], ['Mermaid', '🧜‍♀️'],
            ['Witch', '🧙‍♀️'], ['Fairy', '🧚'], ['Demon', '👿'], ['Pegasus', '🦄']
        ];

        // Add all elements to the elements map
        allElements.forEach(([name, emoji]) => {
            this.elements.set(name, emoji);
        });

        // Only discover the starting elements
        this.discovered.add('Water');
        this.discovered.add('Fire');
        this.discovered.add('Earth');
        this.discovered.add('Air');

        // Add basic recipes
        const basicRecipes = [
            // Basic Element Combinations
            ['Water', 'Fire', 'Steam', '♨️'],
            ['Water', 'Earth', 'Mud', '💩'],
            ['Fire', 'Earth', 'Lava', '🌋'],
            ['Water', 'Air', 'Cloud', '☁️'],
            ['Fire', 'Air', 'Energy', '⚡'],
            ['Earth', 'Air', 'Dust', '💨'],
            
            // Double Element Combinations
            ['Water', 'Water', 'Lake', '💧'],
            ['Fire', 'Fire', 'Inferno', '🔥'],
            ['Earth', 'Earth', 'Mountain', '⛰️'],
            ['Air', 'Air', 'Sky', '🌤️'],
            
            // Basic Result Combinations
            ['Steam', 'Steam', 'Pressure', '💨'],
            ['Steam', 'Fire', 'Smoke', '💨'],
            ['Steam', 'Earth', 'Geyser', '♨️'],
            ['Steam', 'Air', 'Rain', '🌧️'],
            ['Steam', 'Water', 'Cloud', '☁️'],
            
            ['Mud', 'Fire', 'Brick', '🧱'],
            ['Mud', 'Water', 'Swamp', '🥬'],
            ['Mud', 'Air', 'Dust', '💨'],
            ['Mud', 'Earth', 'Clay', '🏺'],
            ['Mud', 'Steam', 'Pottery', '🏺'],
            
            ['Lava', 'Water', 'Stone', '🪨'],
            ['Lava', 'Air', 'Smoke', '💨'],
            ['Lava', 'Earth', 'Volcano', '🌋'],
            ['Lava', 'Fire', 'Magma', '🌋'],
            ['Lava', 'Steam', 'Obsidian', '🖤'],
            
            ['Cloud', 'Fire', 'Lightning', '⚡'],
            ['Cloud', 'Water', 'Rain', '🌧️'],
            ['Cloud', 'Earth', 'Fog', '🌫️'],
            ['Cloud', 'Air', 'Wind', '💨'],
            ['Cloud', 'Energy', 'Storm', '⛈️'],
            
            ['Energy', 'Water', 'Wave', '🌊'],
            ['Energy', 'Fire', 'Plasma', '🌟'],
            ['Energy', 'Earth', 'Life', '🌱'],
            ['Energy', 'Air', 'Lightning', '⚡'],
            ['Energy', 'Storm', 'Thunder', '🌩️'],
            
            ['Dust', 'Water', 'Mud', '💩'],
            ['Dust', 'Fire', 'Smoke', '💨'],
            ['Dust', 'Earth', 'Sand', '🏖️'],
            ['Dust', 'Air', 'Storm', '🌪️'],
            ['Dust', 'Cloud', 'Haze', '🌫️'],
            
            // Triple Element Combinations
            ['Water', 'Fire', 'Earth', 'Mineral', '💎'],
            ['Water', 'Fire', 'Air', 'Rainbow', '🌈'],
            ['Fire', 'Earth', 'Air', 'Metal', '⚙️'],
            ['Water', 'Earth', 'Air', 'Life', '🌱'],
            
            // Lake Combinations
            ['Lake', 'Fire', 'Steam', '♨️'],
            ['Lake', 'Earth', 'Island', '🏝️'],
            ['Lake', 'Air', 'Mist', '🌫️'],
            ['Lake', 'Mountain', 'Waterfall', '🌊'],
            
            // Inferno Combinations
            ['Inferno', 'Water', 'Obsidian', '🖤'],
            ['Inferno', 'Earth', 'Volcano', '🌋'],
            ['Inferno', 'Air', 'Wildfire', '🔥'],
            ['Inferno', 'Mountain', 'Eruption', '🌋'],
            
            // Mountain Combinations
            ['Mountain', 'Water', 'River', '🌊'],
            ['Mountain', 'Fire', 'Volcano', '🌋'],
            ['Mountain', 'Air', 'Wind', '💨'],
            ['Mountain', 'Cloud', 'Peak', '🗻'],
            
            // Sky Combinations
            ['Sky', 'Water', 'Rain', '🌧️'],
            ['Sky', 'Fire', 'Sun', '☀️'],
            ['Sky', 'Earth', 'Horizon', '🌅'],
            ['Sky', 'Cloud', 'Weather', '🌤️']
        ];

        // Add all recipes
        basicRecipes.forEach(([elem1, elem2, result, emoji]) => {
            const key = [elem1, elem2].sort().join('_');
            this.recipes.set(key, { result, emoji });
        });
    }

    addElement(name, emoji) {
        if (!this.elements.has(name)) {
            this.elements.set(name, emoji);
            this.discovered.add(name);
            return true;
        }
        return false;
    }

    getRecipeKey(elem1, elem2) {
        return [elem1, elem2].sort().join('_');
    }

    async combine(elem1, elem2) {
        const key = this.getRecipeKey(elem1, elem2);
        
        if (this.recipes.has(key)) {
            const { result, emoji } = this.recipes.get(key);
            // Add both the element and its emoji
            this.elements.set(result, emoji);
            const isNew = !this.discovered.has(result);
            if (isNew) {
                this.discovered.add(result);
            }
            this.updateElementList();
            return {
                success: true,
                result,
                emoji,
                isNew
            };
        }

        return {
            success: false,
            message: "These elements cannot be combined."
        };
    }

    updateElementList() {
        const elementsList = document.getElementById('elementsList');
        elementsList.innerHTML = '';

        Array.from(this.discovered).sort().forEach(name => {
            const emoji = this.elements.get(name);
            const element = document.createElement('div');
            element.className = 'element';
            element.setAttribute('data-name', name);
            element.draggable = true;
            element.innerHTML = `
                <span class="emoji">${emoji}</span>
                <span class="name">${name}</span>
            `;

            element.addEventListener('dragstart', (e) => {
                element.classList.add('dragging');
                e.dataTransfer.setData('text/plain', name);
            });

            element.addEventListener('dragend', () => {
                element.classList.remove('dragging');
            });

            elementsList.appendChild(element);
        });

        const counter = document.getElementById('discoveredCount');
        counter.textContent = `Discovered: ${this.discovered.size}/${this.elements.size}`;
    }

    initializeUI() {
        const workspace = document.getElementById('craftWorkspace');

        workspace.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        workspace.addEventListener('drop', async (e) => {
            e.preventDefault();
            const draggedElement = document.querySelector('.dragging');
            if (draggedElement) {
                const elements = document.querySelectorAll('#craftWorkspace .element');
                if (elements.length < 2) {
                    const clone = draggedElement.cloneNode(true);
                    workspace.appendChild(clone);
                }

                if (elements.length === 1) {
                    const elem1 = elements[0].getAttribute('data-name');
                    const elem2 = draggedElement.getAttribute('data-name');
                    
                    workspace.innerHTML = '';
                    
                    const result = await this.combine(elem1, elem2);
                    if (result.success) {
                        const resultElement = document.createElement('div');
                        resultElement.className = 'element' + (result.isNew ? ' new' : '');
                        resultElement.innerHTML = `
                            <span class="emoji">${result.emoji}</span>
                            <span class="name">${result.result}</span>
                        `;
                        workspace.appendChild(resultElement);
                        
                        if (result.isNew) {
                            this.showMessage(`New element discovered: ${result.result}!`, 'success');
                        }
                        
                        setTimeout(() => {
                            workspace.innerHTML = '<div class="workspace-hint">Drag elements here to combine them!</div>';
                        }, 2000);
                    } else {
                        this.showMessage(result.message, 'error');
                        workspace.innerHTML = '<div class="workspace-hint">Drag elements here to combine them!</div>';
                    }
                }
            }
        });
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

    resetGame() {
        localStorage.clear();
        window.location.reload();
    }

    showResetConfirmation() {
        if (confirm('Are you sure you want to reset the game? This will delete all your discoveries!')) {
            this.resetGame();
        }
    }

    exportData() {
        try {
            const dataStr = localStorage.getItem('craftGameData');
            if (!dataStr) {
                this.showMessage('No data to export.', 'error');
                return;
            }
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'craft-game-save.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.showMessage('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showMessage('Failed to export data.', 'error');
        }
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = readerEvent => {
                try {
                    const content = readerEvent.target.result;
                    JSON.parse(content); // Validate JSON
                    localStorage.setItem('craftGameData', content);
                    this.showMessage('Data imported successfully! Reloading...', 'success');
                    setTimeout(() => window.location.reload(), 1500);
                } catch (error) {
                    this.showMessage('Invalid save file.', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
}

// Initialize game when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.craftGame = new CraftGame();

    // Attach event listeners for craft game buttons
    document.getElementById('exportDataBtn').addEventListener('click', () => craftGame.exportData());
    document.getElementById('importDataBtn').addEventListener('click', () => craftGame.importData());
    document.getElementById('resetGameBtn').addEventListener('click', () => craftGame.showResetConfirmation());
});
