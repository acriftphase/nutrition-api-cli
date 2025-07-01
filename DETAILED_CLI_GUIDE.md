# 🖥️ Avocavo CLI - Complete Command Line Guide

## 🎯 What Makes This CLI Special

The Avocavo CLI is designed for **developers, data scientists, and DevOps teams** who need nutrition data in scripts, automation, and command-line workflows. Unlike web APIs, this CLI provides:

### ⚡ **Lightning-Fast Command Line Nutrition**
```bash
# Instant ingredient analysis
$ avocavo ingredient "2 cups cooked quinoa"
✅ 2 cups cooked quinoa
  🔥 Calories: 444.0
  🥩 Protein: 16.0g
  🧈 Fat: 7.2g
  🌾 Carbs: 78.0g
  🌿 Fiber: 10.0g
  🧂 Sodium: 26.0mg
🔗 USDA: Quinoa, cooked (ID: 168917)
⏱️  Response time: 89.3ms
```

### 📁 **File-Based Batch Processing**
```bash
# Create ingredient list file
echo "1 cup brown rice
2 tbsp olive oil  
4 oz grilled chicken
1 cup steamed broccoli
1/4 cup almonds" > ingredients.txt

# Analyze entire shopping list
$ avocavo batch -f ingredients.txt
📦 Analyzing 5 ingredients...
✅ Batch analysis complete! (2.3s)

📊 Total Nutrition:
  🔥 Calories: 1,247.0
  🥩 Protein: 58.2g
  🧈 Fat: 67.4g
  🌾 Carbs: 132.8g
  
💰 API Usage: 5 credits (batch discount applied)
```

### 🍳 **Complete Recipe Analysis**
```bash
# Interactive recipe mode
$ avocavo recipe
? Enter ingredients (comma-separated): 2 cups flour, 1 cup milk, 2 eggs, 1/4 cup sugar
? Number of servings: 8

🍳 Analyzing recipe with 4 ingredients (8 servings)...
✅ Recipe analysis complete!

📊 Total Nutrition:
  🔥 Calories: 1,247.0
  🥩 Protein: 45.2g
  🧈 Fat: 18.4g
  🌾 Carbs: 220.8g

🍽️  Per Serving (8 servings):
  🔥 Calories: 155.9
  🥩 Protein: 5.7g
  🧈 Fat: 2.3g
  🌾 Carbs: 27.6g

📝 Ingredient Breakdown:
  ✅ 2 cups flour - 910 cal (USDA verified)
  ✅ 1 cup milk - 149 cal (USDA verified) 
  ✅ 2 eggs - 140 cal (USDA verified)
  ✅ 1/4 cup sugar - 48 cal (USDA verified)

🎯 Recipe Success Rate: 100%
```

### 🔐 **Seamless OAuth Authentication**
```bash
# One-time login setup
$ avocavo login
🔐 Opening browser for Google OAuth...
✅ Successfully logged in!
📊 Account: john@example.com (Starter tier)
📈 Usage: 1,247/2,500 (49% used)

# Check current status anytime
$ avocavo status
✅ Logged in
🔑 API Key: ak_live_12ab...
📊 Account: john@example.com
🎟️  Tier: Starter
📈 Usage: 1,247/2,500
📅 Reset: March 15, 2024
```

## 🛠️ **DevOps & Automation Use Cases**

### 1. **CI/CD Pipeline Integration**
```bash
#!/bin/bash
# check-recipe-nutrition.sh
# Validate recipe nutrition in CI pipeline

RECIPE_FILE="recipes/chicken-stir-fry.txt"
MIN_PROTEIN=20  # grams per serving

# Analyze recipe
NUTRITION=$(avocavo recipe -f "$RECIPE_FILE" -s 4 --json)
PROTEIN=$(echo "$NUTRITION" | jq '.nutrition.per_serving.protein')

if (( $(echo "$PROTEIN >= $MIN_PROTEIN" | bc -l) )); then
    echo "✅ Recipe meets protein requirements ($PROTEIN g)"
    exit 0
else
    echo "❌ Recipe protein too low ($PROTEIN g < $MIN_PROTEIN g)"
    exit 1
fi
```

### 2. **Bulk Data Processing Scripts**
```bash
#!/bin/bash
# process-recipe-database.sh
# Process thousands of recipes for nutrition data

RECIPE_DIR="./recipe-database"
OUTPUT_DIR="./nutrition-output"

# Process all recipe files
for recipe_file in "$RECIPE_DIR"/*.txt; do
    echo "Processing: $(basename "$recipe_file")"
    
    # Extract servings from filename (e.g., "chicken-curry-4servings.txt")
    SERVINGS=$(basename "$recipe_file" | grep -o '[0-9]\+servings' | grep -o '[0-9]\+')
    
    # Analyze and save results
    avocavo recipe -f "$recipe_file" -s "${SERVINGS:-1}" --json > \
        "$OUTPUT_DIR/$(basename "$recipe_file" .txt).json"
    
    # Rate limiting courtesy
    sleep 0.1
done

echo "✅ Processed $(ls "$RECIPE_DIR"/*.txt | wc -l) recipes"
```

### 3. **Meal Planning Automation**
```bash
#!/bin/bash
# weekly-meal-plan.sh
# Generate optimized weekly meal plans

MEAL_PLANS_DIR="./meal-plans"
WEEK="2024-03-11"

# Analyze each day's meals
TOTAL_CALORIES=0
TOTAL_PROTEIN=0

for day in monday tuesday wednesday thursday friday saturday sunday; do
    echo "📅 Analyzing $day..."
    
    # Analyze breakfast, lunch, dinner
    for meal in breakfast lunch dinner; do
        MEAL_FILE="$MEAL_PLANS_DIR/$WEEK/$day-$meal.txt"
        
        if [[ -f "$MEAL_FILE" ]]; then
            NUTRITION=$(avocavo recipe -f "$MEAL_FILE" --json)
            CALORIES=$(echo "$NUTRITION" | jq '.nutrition.total.calories')
            PROTEIN=$(echo "$NUTRITION" | jq '.nutrition.total.protein')
            
            TOTAL_CALORIES=$(echo "$TOTAL_CALORIES + $CALORIES" | bc)
            TOTAL_PROTEIN=$(echo "$TOTAL_PROTEIN + $PROTEIN" | bc)
            
            echo "  $meal: ${CALORIES} cal, ${PROTEIN}g protein"
        fi
    done
done

echo ""
echo "�� Weekly Totals:"
echo "🔥 Calories: $TOTAL_CALORIES"
echo "🥩 Protein: ${TOTAL_PROTEIN}g"
echo "📈 Daily Average: $(echo "scale=0; $TOTAL_CALORIES / 7" | bc) cal"
```

## 📊 **Data Science & Analytics**

### 1. **CSV Export for Analysis**
```bash
# Export nutrition data to CSV
$ cat ingredients.txt | while read ingredient; do
    RESULT=$(avocavo ingredient "$ingredient" --json)
    CALORIES=$(echo "$RESULT" | jq -r '.nutrition.calories')
    PROTEIN=$(echo "$RESULT" | jq -r '.nutrition.protein')
    FAT=$(echo "$RESULT" | jq -r '.nutrition.fat')
    CARBS=$(echo "$RESULT" | jq -r '.nutrition.carbs')
    
    echo "\"$ingredient\",$CALORIES,$PROTEIN,$FAT,$CARBS"
done > nutrition-data.csv

# Headers
sed -i '1i"Ingredient","Calories","Protein","Fat","Carbs"' nutrition-data.csv
```

### 2. **Restaurant Menu Analysis**
```bash
#!/bin/bash
# analyze-restaurant-menu.sh
# Analyze complete restaurant menu for nutritional insights

MENU_DIR="./restaurant-menus"
RESTAURANT="healthy-cafe"

echo "🍽️  Analyzing menu for: $RESTAURANT"
echo "========================================"

HIGH_CALORIE_THRESHOLD=600
HIGH_PROTEIN_ITEMS=()
HIGH_CALORIE_ITEMS=()

# Process each menu item
for menu_item in "$MENU_DIR/$RESTAURANT"/*.txt; do
    ITEM_NAME=$(basename "$menu_item" .txt)
    
    # Analyze nutrition
    NUTRITION=$(avocavo recipe -f "$menu_item" --json)
    CALORIES=$(echo "$NUTRITION" | jq '.nutrition.total.calories')
    PROTEIN=$(echo "$NUTRITION" | jq '.nutrition.total.protein')
    
    echo "$ITEM_NAME: ${CALORIES} cal, ${PROTEIN}g protein"
    
    # Categorize items
    if (( $(echo "$CALORIES > $HIGH_CALORIE_THRESHOLD" | bc -l) )); then
        HIGH_CALORIE_ITEMS+=("$ITEM_NAME ($CALORIES cal)")
    fi
    
    if (( $(echo "$PROTEIN > 20" | bc -l) )); then
        HIGH_PROTEIN_ITEMS+=("$ITEM_NAME (${PROTEIN}g)")
    fi
done

echo ""
echo "📊 Menu Analysis Results:"
echo "🔥 High-calorie items (>$HIGH_CALORIE_THRESHOLD cal):"
printf '%s\n' "${HIGH_CALORIE_ITEMS[@]}"

echo ""
echo "🥩 High-protein items (>20g):"
printf '%s\n' "${HIGH_PROTEIN_ITEMS[@]}"
```

## 🔧 **Advanced CLI Features**

### **JSON Output for Scripting**
```bash
# Get structured data for processing
$ avocavo ingredient "1 cup rice" --json | jq '.nutrition.calories'
205.0

# Pipe through jq for complex queries
$ avocavo batch -f ingredients.txt --json | \
  jq '[.results[] | select(.nutrition.protein > 10) | .ingredient]'
```

### **File Format Support**
```bash
# Simple text file (one ingredient per line)
$ cat > shopping-list.txt << EOF
2 lbs ground beef
1 dozen eggs  
3 cups brown rice
2 lbs spinach
1 lb almonds
