// Baseball positions
const POSITIONS = {
    PITCHER: 'Pitcher',
    CATCHER: 'Catcher',
    FIRST_BASE: '1st Base',
    SECOND_BASE: '2nd Base',
    THIRD_BASE: '3rd Base',
    SHORTSTOP: 'Shortstop',
    LEFT_FIELD: 'Left Field',
    CENTER_FIELD: 'Center Field',
    RIGHT_FIELD: 'Right Field',
    RIGHT_CENTER: 'Right Center',
    BENCH: 'Bench'
};

// Position types for balancing
const POSITION_TYPES = {
    INFIELD: 'infield',
    OUTFIELD: 'outfield',
    BENCH: 'bench'
};

class BattingOrderGenerator {
    constructor(playerNames, numInnings, numOutfielders, hasCatcher) {
        this.players = playerNames.map((name, index) => ({
            name: name.trim(),
            battingOrder: index + 1,
            infieldInnings: 0,
            outfieldInnings: 0,
            benchInnings: 0
        }));
        this.numInnings = numInnings;
        this.numOutfielders = numOutfielders;
        this.hasCatcher = hasCatcher;
        this.innings = [];
        
        // Calculate positions needed per inning
        this.positionsPerInning = this.calculatePositionsNeeded();
    }

    calculatePositionsNeeded() {
        const positions = [];
        
        // Add infield positions
        positions.push(POSITIONS.PITCHER);
        if (this.hasCatcher) {
            positions.push(POSITIONS.CATCHER);
        }
        positions.push(POSITIONS.FIRST_BASE);
        positions.push(POSITIONS.SECOND_BASE);
        positions.push(POSITIONS.THIRD_BASE);
        positions.push(POSITIONS.SHORTSTOP);
        
        // Add outfield positions based on configuration
        const outfieldPositions = [
            POSITIONS.LEFT_FIELD,
            POSITIONS.CENTER_FIELD,
            POSITIONS.RIGHT_FIELD,
            POSITIONS.RIGHT_CENTER
        ];
        
        for (let i = 0; i < this.numOutfielders && i < outfieldPositions.length; i++) {
            positions.push(outfieldPositions[i]);
        }
        
        return positions;
    }

    getPositionType(position) {
        const outfieldPositions = [
            POSITIONS.LEFT_FIELD,
            POSITIONS.CENTER_FIELD,
            POSITIONS.RIGHT_FIELD,
            POSITIONS.RIGHT_CENTER
        ];
        
        if (position === POSITIONS.BENCH) {
            return POSITION_TYPES.BENCH;
        } else if (outfieldPositions.includes(position)) {
            return POSITION_TYPES.OUTFIELD;
        } else {
            return POSITION_TYPES.INFIELD;
        }
    }

    generateLineup() {
        // Generate positions for each inning
        for (let inning = 0; inning < this.numInnings; inning++) {
            this.innings.push(this.generateInningPositions(inning));
        }
        
        return {
            battingOrder: this.players,
            innings: this.innings,
            stats: this.players
        };
    }

    generateInningPositions(inningNumber) {
        const inningPositions = {};
        const availablePlayers = [...this.players];
        const positionsToFill = [...this.positionsPerInning];
        
        // Sort players by innings played in each category to balance playing time
        availablePlayers.sort((a, b) => {
            // First priority: balance total active innings (infield + outfield)
            const aActive = a.infieldInnings + a.outfieldInnings;
            const bActive = b.infieldInnings + b.outfieldInnings;
            if (aActive !== bActive) return aActive - bActive;
            
            // Second priority: balance between infield and outfield
            const aBalance = Math.abs(a.infieldInnings - a.outfieldInnings);
            const bBalance = Math.abs(b.infieldInnings - b.outfieldInnings);
            return aBalance - bBalance;
        });
        
        // Assign positions trying to balance infield and outfield time
        const assignedPlayers = [];
        
        // First pass: Assign players to positions, preferring to balance infield/outfield
        for (const position of positionsToFill) {
            const positionType = this.getPositionType(position);
            
            // Find the best player for this position type
            let bestPlayer = null;
            let bestPlayerIndex = -1;
            
            for (let i = 0; i < availablePlayers.length; i++) {
                const player = availablePlayers[i];
                if (assignedPlayers.includes(player)) continue;
                
                if (!bestPlayer) {
                    bestPlayer = player;
                    bestPlayerIndex = i;
                } else {
                    // Prefer players who need more of this position type
                    if (positionType === POSITION_TYPES.INFIELD) {
                        if (player.infieldInnings < bestPlayer.infieldInnings) {
                            bestPlayer = player;
                            bestPlayerIndex = i;
                        }
                    } else if (positionType === POSITION_TYPES.OUTFIELD) {
                        if (player.outfieldInnings < bestPlayer.outfieldInnings) {
                            bestPlayer = player;
                            bestPlayerIndex = i;
                        }
                    }
                }
            }
            
            if (bestPlayer) {
                inningPositions[position] = bestPlayer.name;
                assignedPlayers.push(bestPlayer);
                
                // Update player stats
                if (positionType === POSITION_TYPES.INFIELD) {
                    bestPlayer.infieldInnings++;
                } else if (positionType === POSITION_TYPES.OUTFIELD) {
                    bestPlayer.outfieldInnings++;
                }
            }
        }
        
        // Remaining players go to bench
        for (const player of availablePlayers) {
            if (!assignedPlayers.includes(player)) {
                if (!inningPositions[POSITIONS.BENCH]) {
                    inningPositions[POSITIONS.BENCH] = [];
                }
                inningPositions[POSITIONS.BENCH].push(player.name);
                player.benchInnings++;
            }
        }
        
        return inningPositions;
    }
}

// UI Controller
class UIController {
    constructor() {
        this.generateBtn = document.getElementById('generateBtn');
        this.printBtn = document.getElementById('printBtn');
        this.playerNamesInput = document.getElementById('playerNames');
        this.numInningsInput = document.getElementById('numInnings');
        this.numOutfieldersInput = document.getElementById('numOutfielders');
        this.hasCatcherInput = document.getElementById('hasCatcher');
        this.resultsSection = document.getElementById('results');
        
        this.attachEventListeners();
    }

    attachEventListeners() {
        this.generateBtn.addEventListener('click', () => this.handleGenerate());
        this.printBtn.addEventListener('click', () => window.print());
    }

    handleGenerate() {
        // Get input values
        const playerNamesText = this.playerNamesInput.value.trim();
        const numInnings = parseInt(this.numInningsInput.value);
        const numOutfielders = parseInt(this.numOutfieldersInput.value);
        const hasCatcher = this.hasCatcherInput.checked;
        
        // Validate inputs
        if (!playerNamesText) {
            alert('Please enter player names');
            return;
        }
        
        const playerNames = playerNamesText.split('\n').filter(name => name.trim());
        
        if (playerNames.length < 9) {
            alert('Please enter at least 9 players');
            return;
        }
        
        // Generate lineup
        const generator = new BattingOrderGenerator(playerNames, numInnings, numOutfielders, hasCatcher);
        const lineup = generator.generateLineup();
        
        // Display results
        this.displayResults(lineup);
    }

    displayResults(lineup) {
        // Show results section
        this.resultsSection.style.display = 'block';
        
        // Display batting order
        this.displayBattingOrder(lineup.battingOrder);
        
        // Display positions by inning
        this.displayPositionsByInning(lineup.innings);
        
        // Display player statistics
        this.displayPlayerStats(lineup.stats);
        
        // Scroll to results
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    displayBattingOrder(battingOrder) {
        const list = document.getElementById('battingOrderList');
        list.innerHTML = '';
        
        battingOrder.forEach(player => {
            const li = document.createElement('li');
            li.textContent = player.name;
            list.appendChild(li);
        });
    }

    displayPositionsByInning(innings) {
        const container = document.getElementById('positionsByInning');
        container.innerHTML = '';
        
        innings.forEach((inningPositions, index) => {
            const inningCard = document.createElement('div');
            inningCard.className = 'inning-card';
            
            const title = document.createElement('h3');
            title.textContent = `Inning ${index + 1}`;
            inningCard.appendChild(title);
            
            const positionsGrid = document.createElement('div');
            positionsGrid.className = 'positions-grid';
            
            // Display field positions
            for (const [position, player] of Object.entries(inningPositions)) {
                if (position !== POSITIONS.BENCH) {
                    const positionItem = document.createElement('div');
                    positionItem.className = 'position-item';
                    
                    const positionLabel = document.createElement('strong');
                    positionLabel.textContent = position;
                    positionItem.appendChild(positionLabel);
                    
                    const playerName = document.createElement('div');
                    playerName.textContent = player;
                    positionItem.appendChild(playerName);
                    
                    positionsGrid.appendChild(positionItem);
                }
            }
            
            inningCard.appendChild(positionsGrid);
            
            // Display bench players if any
            if (inningPositions[POSITIONS.BENCH] && inningPositions[POSITIONS.BENCH].length > 0) {
                const benchSection = document.createElement('div');
                benchSection.style.marginTop = '15px';
                benchSection.style.padding = '10px';
                benchSection.style.background = 'white';
                benchSection.style.borderRadius = '6px';
                
                const benchLabel = document.createElement('strong');
                benchLabel.textContent = 'Bench: ';
                benchLabel.style.color = '#666';
                benchSection.appendChild(benchLabel);
                
                const benchPlayers = document.createElement('span');
                benchPlayers.textContent = inningPositions[POSITIONS.BENCH].join(', ');
                benchSection.appendChild(benchPlayers);
                
                inningCard.appendChild(benchSection);
            }
            
            container.appendChild(inningCard);
        });
    }

    displayPlayerStats(stats) {
        const tbody = document.getElementById('statsTableBody');
        tbody.innerHTML = '';
        
        stats.forEach(player => {
            const row = document.createElement('tr');
            
            const nameCell = document.createElement('td');
            nameCell.textContent = player.name;
            row.appendChild(nameCell);
            
            const orderCell = document.createElement('td');
            orderCell.textContent = player.battingOrder;
            row.appendChild(orderCell);
            
            const infieldCell = document.createElement('td');
            infieldCell.textContent = player.infieldInnings;
            row.appendChild(infieldCell);
            
            const outfieldCell = document.createElement('td');
            outfieldCell.textContent = player.outfieldInnings;
            row.appendChild(outfieldCell);
            
            const benchCell = document.createElement('td');
            benchCell.textContent = player.benchInnings;
            row.appendChild(benchCell);
            
            tbody.appendChild(row);
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new UIController();
});
