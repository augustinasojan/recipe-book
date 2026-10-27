import mongoose, { Schema, type Model } from "mongoose";

export const recipeCategories = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Dessert",
] as const;

export type RecipeCategory = (typeof recipeCategories)[number];

export type RecipeFields = {
  name: string;
  category: RecipeCategory;
  ingredients: string[];
  steps: string[];
  cookingTimeMinutes: number;
};

const recipeSchema = new Schema<RecipeFields>(
  {
    name: { type: String, required: true, trim: true, minlength: 1 },
    category: { type: String, required: true, enum: recipeCategories },
    ingredients: {
      type: [{ type: String, trim: true, minlength: 1 }],
      required: true,
      validate: {
        validator: (items: string[]) => items.length > 0,
        message: "At least one ingredient is required",
      },
    },
    steps: {
      type: [{ type: String, trim: true, minlength: 1 }],
      required: true,
      validate: {
        validator: (items: string[]) => items.length > 0,
        message: "At least one preparation step is required",
      },
    },
    cookingTimeMinutes: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Cooking time must be a whole number of minutes",
      },
    },
  },
  { timestamps: true, versionKey: false },
);

export const Recipe =
  (mongoose.models.Recipe as Model<RecipeFields> | undefined) ??
  mongoose.model<RecipeFields>("Recipe", recipeSchema);
