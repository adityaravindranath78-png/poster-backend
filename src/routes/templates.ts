import { Router } from "express";
import {
  getTemplates,
  getTemplateById,
  getDailyTemplates,
  searchTemplates,
} from "../services/templateService.js";
import { ok, paginated, fail } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// GET /api/v1/templates/daily
router.get("/daily", asyncHandler(async (req, res) => {
  const language = req.query.language as string | undefined;
  const result = await getDailyTemplates(language);
  return paginated(res, result.items);
}));

// GET /api/v1/templates/search
router.get("/search", asyncHandler(async (req, res) => {
  const q = req.query.q as string;
  if (!q) return paginated(res, []);

  const limit = parseInt(req.query.limit as string) || 20;
  const result = await searchTemplates(q, limit);
  return paginated(res, result.items);
}));

// GET /api/v1/templates/:id
router.get("/:id", asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const template = await getTemplateById(id);
  if (!template) return fail(res, "Template not found", 404);
  return ok(res, template);
}));

// GET /api/v1/templates
router.get("/", asyncHandler(async (req, res) => {
  const { category, language, limit, nextKey } = req.query;
  const result = await getTemplates({
    category: category as string | undefined,
    language: language as string | undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    nextKey: nextKey as string | undefined,
  });
  return paginated(res, result.items, result.nextKey);
}));

export default router;
