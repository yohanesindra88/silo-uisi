import os
from PIL import Image

def resize_image(file_path, max_size=800):
    try:
        size_bytes = os.path.getsize(file_path)
        # Only process files larger than 1MB to save time
        if size_bytes > 1024 * 1024:
            with Image.open(file_path) as img:
                # Correct image orientation from EXIF if present
                try:
                    from PIL import ExifTags
                    for orientation in ExifTags.TAGS.keys():
                        if ExifTags.TAGS[orientation] == 'Orientation':
                            break
                    exif = img._getexif()
                    if exif is not None:
                        exif = dict(exif.items())
                        if orientation in exif:
                            if exif[orientation] == 3:
                                img = img.rotate(180, expand=True)
                            elif exif[orientation] == 6:
                                img = img.rotate(270, expand=True)
                            elif exif[orientation] == 8:
                                img = img.rotate(90, expand=True)
                except Exception:
                    pass

                img.thumbnail((max_size, max_size))
                # Save it back, compressed
                img.save(file_path, optimize=True, quality=85)
                print(f"Resized: {file_path}")
    except Exception as e:
        print(f"Failed {file_path}: {e}")

directory = r"c:\AlSudahMakan\Vscode Project\aethera-uisi\public\fotoAnggota"

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.lower().endswith(('.jpg', '.jpeg', '.png')):
            resize_image(os.path.join(root, file))

print("Done resizing images.")
