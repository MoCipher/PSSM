#!/bin/bash

# Generate PNG icons from SVG with transparent backgrounds
# Requires: ImageMagick or rsvg-convert (install via: brew install librsvg)

cd "$(dirname "$0")/../public"

# Check if rsvg-convert is available
if command -v rsvg-convert &> /dev/null; then
    echo "Using rsvg-convert to generate PNG icons..."
    
    # Generate 192x192 icon
    rsvg-convert -w 192 -h 192 -b none icon.svg > icon-192.png
    echo "✓ Generated icon-192.png"
    
    # Generate 512x512 icon
    rsvg-convert -w 512 -h 512 -b none icon.svg > icon-512.png
    echo "✓ Generated icon-512.png"
    
    # Generate 512x512 maskable icon
    rsvg-convert -w 512 -h 512 -b none icon-maskable.svg > icon-maskable-512.png
    echo "✓ Generated icon-maskable-512.png"
    
    # Generate 180x180 Apple touch icon
    rsvg-convert -w 180 -h 180 -b none icon.svg > apple-touch-icon.png
    echo "✓ Generated apple-touch-icon.png"
    
    echo "✅ All icons generated successfully!"
    
elif command -v convert &> /dev/null; then
    echo "Using ImageMagick to generate PNG icons..."
    
    # Generate 192x192 icon
    convert -background none -resize 192x192 icon.svg icon-192.png
    echo "✓ Generated icon-192.png"
    
    # Generate 512x512 icon
    convert -background none -resize 512x512 icon.svg icon-512.png
    echo "✓ Generated icon-512.png"
    
    # Generate 512x512 maskable icon
    convert -background none -resize 512x512 icon-maskable.svg icon-maskable-512.png
    echo "✓ Generated icon-maskable-512.png"
    
    # Generate 180x180 Apple touch icon
    convert -background none -resize 180x180 icon.svg apple-touch-icon.png
    echo "✓ Generated apple-touch-icon.png"
    
    echo "✅ All icons generated successfully!"
    
else
    echo "❌ Error: Neither rsvg-convert nor ImageMagick convert found."
    echo "Please install one of them:"
    echo "  - For rsvg-convert: brew install librsvg"
    echo "  - For ImageMagick: brew install imagemagick"
    exit 1
fi
