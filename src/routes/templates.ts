import { Router } from "express";
import {
  getTemplates,
  getTemplateById,
  getDailyTemplates,
  searchTemplates,
} from "../services/templateService.js";
import { ok, paginated, fail } from "../utils/response.js";

const router = Router();

// GET /api/v1/templates/daily
router.get("/daily", async (req, res, next) => {
  try {
    const language = req.query.language as string | undefined;
    const result = await getDailyTemplates(language);
    return paginated(res, result.items);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/templates/search
router.get("/search", async (req, res, next) => {
  try {
    const q = req.query.q as string;
    if (!q) return paginated(res, []);

    const limit = parseInt(req.query.limit as string) || 20;
    const result = await searchTemplates(q, limit);
    return paginated(res, result.items);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/templates/:id
router.get("/:id", async (req, res, next) => {
  try {
    const template = await getTemplateById(req.params.id);
    if (!template) return fail(res, "Template not found", 404);
    return ok(res, template);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/templates
router.get("/", async (req, res, next) => {
  try {
    const { category, language, limit, nextKey } = req.query;
    const result = await getTemplates({
      category: category as string | undefined,
      language: language as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      nextKey: nextKey as string | undefined,
    });
    return paginated(res, result.items, result.nextKey);
  } catch (err) {
    next(err);
  }
});

export default router;
