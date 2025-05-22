from PIL import Image

# Load the original image
original_image = Image.open("favicon.png")

# Define the sizes you want
sizes = [16, 32, 64, 128, 256, 512]

# Loop through each size and save a resized version
for size in sizes:
    resized = original_image.resize((size, size), Image.LANCZOS)
    resized.save(f"icon_{size}x{size}.png")

print("All resized icons saved.")
