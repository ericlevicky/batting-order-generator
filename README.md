# ⚾ Little League Batting Order Generator

A web application for generating batting orders and field positions for little league baseball games.

## Features

- **Consistent Batting Order**: Players maintain the same batting order throughout the game
- **Position Rotation**: Positions change each inning with automatic balancing
- **Fair Playing Time**: Automatically balances infield and outfield innings for each player
- **Configurable Settings**:
  - Number of innings (1-9)
  - Number of outfielders (2-4)
  - Optional catcher position
- **Bench Management**: Extra players rotate through the bench while all players bat
- **Statistics Tracking**: View each player's infield, outfield, and bench time
- **Print-Friendly**: Easy-to-print lineup sheets for game day

## Usage

1. Open `index.html` in a web browser
2. Enter player names (one per line)
3. Configure game settings:
   - Number of innings
   - Number of outfielders
   - Whether to include a catcher position
4. Click "Generate Lineup"
5. Review the batting order and position assignments
6. Use the "Print Lineup" button to print for game day

## Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- No installation or dependencies required

## How It Works

### Batting Order
- Players are assigned a batting order based on the order they're entered
- This batting order remains consistent throughout all innings
- All players bat, including those on the bench

### Position Assignment
The algorithm ensures fair distribution of positions:
1. **Balancing**: Players with fewer active innings get priority for field positions
2. **Variety**: The system balances time between infield and outfield positions
3. **Rotation**: Positions rotate each inning to give everyone different experiences
4. **Bench**: Players not on the field sit on the bench but remain in the batting order

### Statistics
After generating a lineup, you can view:
- Each player's batting order position
- Number of innings in infield positions
- Number of innings in outfield positions
- Number of innings on the bench

## License

Open source - feel free to use and modify for your team!