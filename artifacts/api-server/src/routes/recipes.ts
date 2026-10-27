import { Router, type IRouter } from "express";
import mongoose, { type HydratedDocument } from "mongoose";
import {
  CreateRecipeBody,
  CreateRecipeResponse,
  DeleteRecipeParams,
  DeleteRecipeResponse,
  GetRecipeParams,
  GetRecipeResponse,
  ListRecipesResponse,
  UpdateRecipeBody,
  UpdateRecipeParams,
  UpdateRecipeResponse,
} from "@workspace/api-zod";
import { Recipe, type RecipeFields } from "../models/recipe";

const router: IRouter = Router();

type RecipeChanges = Partial<RecipeFields>;

function serializeRecipe(recipe: HydratedDocument<RecipeFields>) {
  const stored = recipe.toObject();
  return {
    id: recipe._id.toString(),
    name: stored.name,
    category: stored.category,
    ingredients: stored.ingredients,
    steps: stored.steps,
    cookingTimeMinutes: stored.cookingTimeMinutes,
    createdAt: (recipe.get("createdAt") as Date).toISOString(),
    updatedAt: (recipe.get("updatedAt") as Date).toISOString(),
  };
}

function normalizeRecipeChanges(changes: RecipeChanges): RecipeChanges {
  return {
    ...changes,
    ...(changes.name !== undefined ? { name: changes.name.trim() } : {}),
    ...(changes.ingredients !== undefined
      ? { ingredients: changes.ingredients.map((item) => item.trim()) }
      : {}),
    ...(changes.steps !== undefined
      ? { steps: changes.steps.map((step) => step.trim()) }
      : {}),
  };
}

function normalizedFieldsError(changes: RecipeChanges): string | undefined {
  if (changes.name !== undefined && changes.name.length === 0) {
    return "Recipe name cannot be empty.";
  }
  if (
    changes.ingredients !== undefined &&
    (changes.ingredients.length === 0 ||
      changes.ingredients.some((ingredient) => ingredient.length === 0))
  ) {
    return "Add at least one non-empty ingredient.";
  }
  if (
    changes.steps !== undefined &&
    (changes.steps.length === 0 || changes.steps.some((step) => step.length === 0))
  ) {
    return "Add at least one non-empty preparation step.";
  }
  return undefined;
}

function sendStorageError(
  req: Parameters<Parameters<IRouter["get"]>[1]>[0],
  res: Parameters<Parameters<IRouter["get"]>[1]>[1],
  operation: string,
  error: unknown,
): void {
  req.log.error(
    {
      operation,
      errorName: error instanceof Error ? error.name : "UnknownError",
    },
    "Recipe database operation failed",
  );
  res.status(500).json({
    error: "Could not access recipes right now. Please try again.",
  });
}

function parseId(
  req: Parameters<Parameters<IRouter["get"]>[1]>[0],
  res: Parameters<Parameters<IRouter["get"]>[1]>[1],
  schema: typeof GetRecipeParams | typeof UpdateRecipeParams | typeof DeleteRecipeParams,
): string | undefined {
  const parsed = schema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "A valid recipe ID is required." });
    return undefined;
  }
  if (!mongoose.isValidObjectId(parsed.data.id)) {
    res.status(400).json({ error: "A valid recipe ID is required." });
    return undefined;
  }
  return parsed.data.id;
}

router.get("/recipes", async (req, res): Promise<void> => {
  try {
    const recipes = await Recipe.find().sort({ createdAt: -1 });
    res.json(ListRecipesResponse.parse(recipes.map(serializeRecipe)));
  } catch (error) {
    sendStorageError(req, res, "list", error);
  }
});

router.post("/recipes", async (req, res): Promise<void> => {
  const parsed = CreateRecipeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.issues.map((issue) => issue.message).join(" "),
    });
    return;
  }

  const changes = normalizeRecipeChanges(parsed.data);
  const invalidField = normalizedFieldsError(changes);
  if (invalidField) {
    res.status(400).json({ error: invalidField });
    return;
  }

  try {
    const recipe = await Recipe.create(changes);
    res.status(201).json(CreateRecipeResponse.parse(serializeRecipe(recipe)));
  } catch (error) {
    sendStorageError(req, res, "create", error);
  }
});

router.get("/recipes/:id", async (req, res): Promise<void> => {
  const id = parseId(req, res, GetRecipeParams);
  if (!id) return;

  try {
    const recipe = await Recipe.findById(id);
    if (!recipe) {
      res.status(404).json({ error: "Recipe not found." });
      return;
    }
    res.json(GetRecipeResponse.parse(serializeRecipe(recipe)));
  } catch (error) {
    sendStorageError(req, res, "get", error);
  }
});

router.patch("/recipes/:id", async (req, res): Promise<void> => {
  const id = parseId(req, res, UpdateRecipeParams);
  if (!id) return;

  const parsed = UpdateRecipeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.issues.map((issue) => issue.message).join(" "),
    });
    return;
  }
  if (Object.keys(parsed.data).length === 0) {
    res.status(400).json({ error: "Provide at least one field to update." });
    return;
  }

  const changes = normalizeRecipeChanges(parsed.data);
  const invalidField = normalizedFieldsError(changes);
  if (invalidField) {
    res.status(400).json({ error: invalidField });
    return;
  }

  try {
    const recipe = await Recipe.findByIdAndUpdate(
      id,
      { $set: changes },
      { new: true, runValidators: true },
    );
    if (!recipe) {
      res.status(404).json({ error: "Recipe not found." });
      return;
    }
    res.json(UpdateRecipeResponse.parse(serializeRecipe(recipe)));
  } catch (error) {
    sendStorageError(req, res, "update", error);
  }
});

router.delete("/recipes/:id", async (req, res): Promise<void> => {
  const id = parseId(req, res, DeleteRecipeParams);
  if (!id) return;

  try {
    const recipe = await Recipe.findByIdAndDelete(id);
    if (!recipe) {
      res.status(404).json({ error: "Recipe not found." });
      return;
    }
    res.json(DeleteRecipeResponse.parse({ success: true }));
  } catch (error) {
    sendStorageError(req, res, "delete", error);
  }
});

export default router;
