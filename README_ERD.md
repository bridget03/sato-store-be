# E-Commerce System Entity-Relationship Diagram

This document contains a PlantUML Entity-Relationship Diagram (ERD) for the e-commerce system with User, Product, and Cart entities.

## ERD Explanation

The diagram shows the following entities and their relationships:

1. **User**

   - Has properties like username, email, password, and role
   - One user can have one cart (one-to-one relationship)

2. **Product**

   - Has properties like name, description, price, image, type, and stock status
   - Products can be referenced in multiple cart items

3. **Cart**

   - Belongs to a user (references userId)
   - Contains multiple cart items
   - Tracks the total amount

4. **CartItem**
   - Embedded document within Cart (not a separate MongoDB collection)
   - References a product
   - Stores quantity, price, name, and image

## How to Render the PlantUML Diagram

### Option 1: Online PlantUML Editor

1. Visit [PlantUML Online Editor](https://www.plantuml.com/plantuml/uml/)
2. Copy the contents of the `ERD.puml` file
3. Paste into the editor
4. The diagram will render automatically

### Option 2: Visual Studio Code with PlantUML Extension

1. Install the PlantUML extension for VS Code
2. Open the `ERD.puml` file
3. Right-click and select "Preview Current Diagram"

### Option 3: Generate Image from Command Line

If you have Java installed:

1. Download the PlantUML JAR file from [PlantUML website](https://plantuml.com/download)
2. Run: `java -jar plantuml.jar ERD.puml`
3. This will generate an image file in the same directory

## Database Structure

This ERD represents a MongoDB-based system where:

- User and Product are stored as separate collections
- Cart is a collection with CartItem as an embedded document
- Relationships are maintained through ObjectId references
