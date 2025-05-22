import json
import random
from pathlib import Path

# Load data
with open("recipes.json", "r") as f:
    data = json.load(f)

# Initialize 4 empty buckets
buckets = {i: [] for i in range(4)}

# Distribute recipes randomly and evenly
for recipe in data:
    bucket_index = random.randint(0, 3)  # randomly pick 0,1,2 or 3
    buckets[bucket_index].append(recipe)

# Create output directory
out_dir = Path("./")
out_dir.mkdir(exist_ok=True)

# Save each bucket to its own file
for idx, recipes in buckets.items():
    path = out_dir / f"recipes_{idx}.json"
    with open(path, "w") as f:
        json.dump(recipes, f)

print("✅ Randomly distributed recipes into 4 buckets.")
