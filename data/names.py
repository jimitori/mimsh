import os
import json

# Configure the directory containing the images
IMAGE_FOLDER = "/Users/mainuser/Yandex.Disk.localized/Дизайн/mimsh/images/posters"  # Change this to your actual folder path
OUTPUT_FILE = "output.json"

# Function to format the filename into the required JSON structure
def format_filename(filename):
    name, ext = os.path.splitext(filename)
    if not ext.lower() in [".jpg", ".jpeg", ".png", ".gif"]:
        return None  # Skip non-image files
    
    parts = name.split("-", 1)
    if len(parts) < 2:
        return None  # Skip files without the expected format
    
    number = parts[0].strip()
    title = parts[1].replace("-", " ").strip().title()
    
    return {
        "image": filename,
        "title": f"{number}: {title}"
    }

# Get list of image files and process them
file_list = [format_filename(f) for f in os.listdir(IMAGE_FOLDER) if format_filename(f)]

# Save to JSON file
with open(OUTPUT_FILE, "w", encoding="utf-8") as json_file:
    json.dump(file_list, json_file, indent=4, ensure_ascii=False)

print(f"JSON file saved as {OUTPUT_FILE}")
