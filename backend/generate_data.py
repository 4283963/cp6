import csv
import random
import math

random.seed(42)

num_samples = 50
x_range = (0, 100)
y_range = (0, 100)
samples = []

for i in range(num_samples):
    x = round(random.uniform(*x_range), 2)
    y = round(random.uniform(*y_range), 2)
    cx, cy = 50, 50
    dist = math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / 70.71
    base_ph = 4.5 + dist * 4.5
    noise = random.uniform(-0.5, 0.5)
    ph = round(max(3.5, min(9.5, base_ph + noise)), 2)
    samples.append((i + 1, x, y, ph))

with open('soil_samples.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['id', 'x', 'y', 'ph'])
    writer.writerows(samples)

print(f"Generated {len(samples)} soil samples -> soil_samples.csv")
