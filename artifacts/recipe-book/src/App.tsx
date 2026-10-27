import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Switch, useLocation, useRoute, Router as WouterRouter } from 'wouter';
import {
  ArrowLeft, ArrowRight, BookOpen, Check, ChefHat, Clock3, Edit3, ListFilter,
  Plus, Search, Trash2, Utensils, X,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import {
  getGetRecipeQueryKey, getListRecipesQueryKey, useCreateRecipe, useDeleteRecipe,
  useGetRecipe, useListRecipes, useUpdateRecipe,
} from '@workspace/api-client-react';
import type { Recipe, RecipeCategory, RecipeInput } from '@workspace/api-client-react';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const categories: RecipeCategory[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];

function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-[hsl(var(--border)/.78)] bg-[hsl(var(--background)/.92)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 md:px-8">
        <Link href="/" className="group flex items-center gap-3 no-underline" data-testid="link-home">
          <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm transition-transform group-hover:-rotate-3">
            <BookOpen size={20} strokeWidth={1.8} />
          </span>
          <span>
            <span className="block font-serif text-[21px] font-semibold leading-none tracking-[-.04em]">recipe book</span>
            <span className="mt-1 block text-[9px] font-bold uppercase tracking-[.19em] text-muted-foreground">your kitchen, remembered</span>
          </span>
        </Link>
        <Link href="/recipes/new" className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background no-underline transition-colors hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))]" data-testid="link-add-recipe">
          <Plus size={16} /> <span className="hidden sm:inline">Add a recipe</span><span className="sm:hidden">Add</span>
        </Link>
      </div>
    </header>
  );
}

function AppFrame({ children }: { children: ReactNode }) {
  return <div className="min-h-[100dvh]"><Header /><main className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">{children}</main></div>;
}

function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <div role={error ? 'alert' : 'status'} className={`rounded-2xl border px-5 py-4 text-sm ${error ? 'border-red-300 bg-red-50 text-red-800' : 'border-[hsl(var(--border))] bg-card text-muted-foreground'}`}>{children}</div>;
}

function usePageMetadata(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    const setMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.append(element);
      }
      element.content = content;
    };
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
  }, [title, description]);
}

function LoadingGrid() {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading recipes">
    {[0, 1, 2, 3, 4, 5].map((n) => <div key={n} className="h-56 animate-pulse rounded-[22px] border border-card-border bg-card/80 p-5"><div className="h-5 w-20 rounded bg-muted" /><div className="mt-8 h-7 w-3/4 rounded bg-muted" /><div className="mt-4 h-4 w-full rounded bg-muted" /><div className="mt-2 h-4 w-2/3 rounded bg-muted" /></div>)}
  </div>;
}

const categoryTint: Record<string, string> = {
  Breakfast: 'bg-[#ead8ad] text-[#684e25]',
  Lunch: 'bg-[#d7e3d3] text-[#385943]',
  Dinner: 'bg-[#ecd2c8] text-[#824d3e]',
  Snack: 'bg-[#e3d7e6] text-[#66516c]',
  Dessert: 'bg-[#f0d7d8] text-[#874f59]',
};

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const ingredientsPreview = recipe.ingredients.slice(0, 3).join(' · ');
  return (
    <Link href={`/recipes/${recipe.id}`} className="recipe-card group flex min-h-[235px] flex-col rounded-[22px] border border-card-border bg-card p-5 text-inherit no-underline paper-shadow" data-testid={`card-recipe-${recipe.id}`}>
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.13em] ${categoryTint[recipe.category]}`}>{recipe.category}</span>
        <ArrowRight size={17} className="text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
      </div>
      <h2 className="mt-7 font-serif text-[25px] font-semibold leading-[1.12] tracking-[-.035em]">{recipe.name}</h2>
      <p className="mt-3 line-clamp-2 text-[13px] leading-5 text-muted-foreground">{ingredientsPreview}{recipe.ingredients.length > 3 ? ' · …' : ''}</p>
      <div className="mt-auto flex items-center gap-2 pt-5 text-xs font-medium text-muted-foreground">
        <Clock3 size={14} /> <span>{recipe.cookingTimeMinutes} min</span>
        <span className="mx-1 h-1 w-1 rounded-full bg-[hsl(var(--primary))]" />
        <span>{recipe.ingredients.length} ingredients</span>
      </div>
    </Link>
  );
}

function CollectionPage() {
  usePageMetadata('Recipe Book — Your kitchen, remembered', 'Keep the recipes you love organized, searchable, and ready to make again.');
  const { data: recipes, isLoading, isError, refetch, isFetching } = useListRecipes();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<RecipeCategory | 'All'>('All');
  const filtered = useMemo(() => (recipes ?? []).filter((recipe) => {
    const matchesCategory = category === 'All' || recipe.category === category;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || recipe.name.toLowerCase().includes(query)
      || recipe.ingredients.some((ingredient) => ingredient.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  }), [recipes, category, search]);

  return (
    <div className="page-enter">
      <section className="relative mb-9 overflow-hidden rounded-[28px] border border-card-border bg-[#e7e4d3] px-6 py-8 sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-12 -top-14 h-64 w-64 rounded-full border border-[#b4b8a2]/50 sm:right-10 sm:top-[-86px] sm:h-80 sm:w-80">
          <div className="absolute inset-5 rounded-full border border-[#b4b8a2]/50" />
          <div className="absolute inset-12 rounded-full border border-[#b4b8a2]/50" />
          <div className="absolute bottom-7 left-1/2 top-7 border-l border-[#b4b8a2]/50" />
          <div className="absolute left-7 right-7 top-1/2 border-t border-[#b4b8a2]/50" />
        </div>
        <div className="relative max-w-2xl">
          <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-[#64705d]"><Utensils size={13} /> The home kitchen archive</div>
          <h1 className="max-w-xl font-serif text-[clamp(2.5rem,7vw,4.6rem)] font-semibold leading-[.98] tracking-[-.055em] text-[#273a32]">The good ones,<br /><em className="font-medium text-[#a64c38]">all in one place.</em></h1>
          <p className="mt-5 max-w-md text-[15px] leading-6 text-[#536258]">A little home for the meals worth making again. Find the one you’re craving and get cooking.</p>
          <div className="mt-7 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.13em] text-[#536258]">
            <span className="font-serif text-2xl font-semibold tracking-normal text-[#a64c38]">{recipes?.length ?? '—'}</span> recipes kept close
          </div>
        </div>
        <div className="absolute bottom-5 right-6 hidden rotate-[-8deg] rounded-md border border-[#bdad83] bg-[#f6edcf] px-3 py-2 font-serif text-sm italic text-[#746848] shadow-sm md:block">made with love</div>
      </section>

      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--primary))]"><span className="h-px w-6 bg-[hsl(var(--primary))]" /> From your notebook</div>
          <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-.035em]">Your collection</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex min-w-0 items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2.5 sm:w-64">
            <Search size={16} className="shrink-0 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a recipe or ingredient" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" aria-label="Search recipes" data-testid="input-search-recipes" />
            {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="text-muted-foreground hover:text-foreground"><X size={15} /></button>}
          </label>
          <label className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5">
            <ListFilter size={15} className="text-muted-foreground" />
            <select value={category} onChange={(e) => setCategory(e.target.value as RecipeCategory | 'All')} className="cursor-pointer bg-transparent text-sm font-medium outline-none" aria-label="Filter by category" data-testid="select-category">
              <option value="All">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </div>

      {isLoading ? <LoadingGrid /> : isError ? <Notice error><div className="flex items-center justify-between gap-4"><span>Your recipes couldn’t be loaded just now.</span><button onClick={() => refetch()} className="font-semibold underline" data-testid="button-retry">Try again</button></div></Notice> : filtered.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[#c9c0a9] bg-card/65 px-6 py-12 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary text-secondary-foreground"><ChefHat size={23} /></span>
          <h3 className="mt-5 font-serif text-2xl font-semibold">{recipes?.length ? 'Nothing in this corner yet' : 'Your notebook is waiting'}</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{recipes?.length ? 'Try a different search or category to find what you’re looking for.' : 'Start with the dish you make by heart. It’ll be right here next time.'}</p>
          {!recipes?.length && <Link href="/recipes/new" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground no-underline" data-testid="link-create-first"><Plus size={16} /> Write your first recipe</Link>}
          {!!recipes?.length && <button onClick={() => { setSearch(''); setCategory('All'); }} className="mt-5 text-sm font-semibold text-primary underline underline-offset-4" data-testid="button-clear-filters">Clear filters</button>}
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground"><span>{filtered.length} {filtered.length === 1 ? 'recipe' : 'recipes'}</span>{isFetching && <span>Refreshing…</span>}</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}</div>
        </>
      )}
      <footer className="mt-14 flex items-center justify-center gap-2 border-t border-border/70 py-6 text-xs text-muted-foreground"><BookOpen size={14} /> A good meal is worth remembering.</footer>
    </div>
  );
}

type FormValues = { name: string; category: RecipeCategory; cookingTimeMinutes: string; ingredients: string; steps: string };
function RecipeForm({ initial, recipeId }: { initial?: Recipe; recipeId?: string }) {
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const editing = Boolean(recipeId);
  usePageMetadata(
    editing ? 'Edit a recipe | Recipe Book' : 'Add a recipe | Recipe Book',
    editing ? 'Update the ingredients, method, category, or cooking time for a saved recipe.' : 'Save a favorite recipe with its ingredients, preparation steps, category, and cooking time.',
  );
  const [values, setValues] = useState<FormValues>({
    name: initial?.name ?? '',
    category: initial?.category ?? 'Dinner',
    cookingTimeMinutes: initial ? String(initial.cookingTimeMinutes) : '',
    ingredients: initial?.ingredients.join('\n') ?? '',
    steps: initial?.steps.join('\n') ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const pending = createRecipe.isPending || updateRecipe.isPending;
  const setField = (field: keyof FormValues, value: string) => setValues((current) => ({ ...current, [field]: value }));
  const parsedIngredients = values.ingredients.split('\n').map((item) => item.trim()).filter(Boolean);
  const parsedSteps = values.steps.split('\n').map((item) => item.trim()).filter(Boolean);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!values.name.trim()) nextErrors.name = 'Give this recipe a name.';
    if (!values.cookingTimeMinutes || !Number.isInteger(Number(values.cookingTimeMinutes)) || Number(values.cookingTimeMinutes) < 1) nextErrors.cookingTimeMinutes = 'Enter a whole number of minutes, at least 1.';
    if (parsedIngredients.length === 0) nextErrors.ingredients = 'Add at least one ingredient, one per line.';
    if (parsedSteps.length === 0) nextErrors.steps = 'Add at least one step, one per line.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const payload: RecipeInput = {
      name: values.name.trim(),
      category: values.category,
      cookingTimeMinutes: Number(values.cookingTimeMinutes),
      ingredients: parsedIngredients,
      steps: parsedSteps,
    };
    if (editing && recipeId) {
      updateRecipe.mutate({ id: recipeId, data: payload }, {
        onSuccess: async (recipe) => {
          await Promise.all([
            client.invalidateQueries({ queryKey: getListRecipesQueryKey() }),
            client.invalidateQueries({ queryKey: getGetRecipeQueryKey(recipeId) }),
          ]);
          toast.success('Recipe updated successfully.');
          navigate(`/recipes/${recipe.id}`);
        },
      });
    } else {
      createRecipe.mutate({ data: payload }, {
        onSuccess: async (recipe) => {
          await client.invalidateQueries({ queryKey: getListRecipesQueryKey() });
          toast.success('Recipe saved successfully.');
          navigate(`/recipes/${recipe.id}`);
        },
      });
    }
  };
  const mutationError = createRecipe.error || updateRecipe.error;
  const fieldClass = 'mt-2 w-full rounded-xl border border-border bg-[hsl(var(--background))] px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15';
  const errorText = (key: string) => errors[key] ? <p className="mt-1.5 text-xs text-red-700">{errors[key]}</p> : null;

  return (
    <div className="page-enter mx-auto max-w-3xl">
      <Link href={editing && recipeId ? `/recipes/${recipeId}` : '/'} className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground no-underline hover:text-foreground" data-testid="link-back"><ArrowLeft size={16} /> {editing ? 'Back to recipe' : 'Back to collection'}</Link>
      <div className="overflow-hidden rounded-[26px] border border-card-border bg-card paper-shadow">
        <div className="border-b border-border bg-[#e8e4d3] px-6 py-7 sm:px-9">
          <div className="text-[10px] font-bold uppercase tracking-[.2em] text-[#a64c38]">{editing ? 'A little adjustment' : 'Add to the notebook'}</div>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-[-.05em]">{editing ? 'Edit this recipe' : 'Write it down'}</h1>
          <p className="mt-2 text-sm text-[#58645a]">Keep the details that make it yours.</p>
        </div>
        <form onSubmit={submit} noValidate className="space-y-7 px-6 py-7 sm:px-9 sm:py-9">
          {mutationError && <Notice error>{(mutationError as Error).message || 'This recipe could not be saved. Please try again.'}</Notice>}
          <div className="grid gap-5 sm:grid-cols-[1fr_190px]">
            <label className="block text-sm font-semibold">Recipe name
              <input value={values.name} onChange={(e) => setField('name', e.target.value)} placeholder="e.g. Sunday tomato sauce" className={fieldClass} maxLength={160} data-testid="input-recipe-name" aria-invalid={Boolean(errors.name)} />
              {errorText('name')}
            </label>
            <label className="block text-sm font-semibold">Category
              <select value={values.category} onChange={(e) => setField('category', e.target.value)} className={fieldClass} data-testid="select-recipe-category">{categories.map((item) => <option key={item}>{item}</option>)}</select>
            </label>
          </div>
          <label className="block max-w-[210px] text-sm font-semibold">Cooking time
            <span className="mt-2 flex items-center rounded-xl border border-border bg-[hsl(var(--background))] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
              <input type="number" min="1" step="1" inputMode="numeric" value={values.cookingTimeMinutes} onChange={(e) => setField('cookingTimeMinutes', e.target.value)} placeholder="35" className="w-full bg-transparent px-4 py-3 text-sm outline-none" data-testid="input-cooking-time" />
              <span className="pr-4 text-xs font-medium text-muted-foreground">minutes</span>
            </span>
            {errorText('cookingTimeMinutes')}
          </label>
          <label className="block text-sm font-semibold">Ingredients
            <span className="mt-1 block text-xs font-normal text-muted-foreground">One ingredient per line. Add quantities if you like.</span>
            <textarea value={values.ingredients} onChange={(e) => setField('ingredients', e.target.value)} rows={6} placeholder={'2 tbsp olive oil\n1 small onion, diced\nA pinch of sea salt'} className={`${fieldClass} resize-y leading-7`} data-testid="textarea-ingredients" />
            {errorText('ingredients')}
          </label>
          <label className="block text-sm font-semibold">Method
            <span className="mt-1 block text-xs font-normal text-muted-foreground">One step per line, in the order you make it.</span>
            <textarea value={values.steps} onChange={(e) => setField('steps', e.target.value)} rows={7} placeholder={'Warm the oil in a heavy pan.\nAdd the onion and cook until soft.\nTaste, season, and serve.'} className={`${fieldClass} resize-y leading-7`} data-testid="textarea-steps" />
            {errorText('steps')}
          </label>
          <div className="flex flex-col-reverse justify-between gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
            <span className="text-xs text-muted-foreground">Each line becomes its own item in your recipe.</span>
            <button type="submit" disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60" data-testid="button-save-recipe">
              {pending ? 'Saving…' : <>{editing ? <Check size={16} /> : <Plus size={16} />}{editing ? 'Save changes' : 'Save recipe'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewRecipePage() { return <RecipeForm />; }

function RecipeLoading() {
  return <div className="mx-auto max-w-4xl animate-pulse"><div className="h-4 w-28 rounded bg-muted" /><div className="mt-8 h-14 w-2/3 rounded bg-muted" /><div className="mt-5 h-5 w-1/3 rounded bg-muted" /><div className="mt-10 grid gap-5 md:grid-cols-2"><div className="h-72 rounded-2xl bg-muted" /><div className="h-72 rounded-2xl bg-muted" /></div></div>;
}

function RecipeDetails({ id }: { id: string }) {
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const { data: recipe, isLoading, isError, refetch } = useGetRecipe(id);
  const deleteRecipe = useDeleteRecipe();
  const [confirmDelete, setConfirmDelete] = useState(false);
  usePageMetadata(
    recipe ? `${recipe.name} | Recipe Book` : 'Recipe details | Recipe Book',
    recipe ? `Ingredients and preparation steps for ${recipe.name}.` : 'View the ingredients and preparation steps for a saved recipe.',
  );
  if (isLoading) return <RecipeLoading />;
  if (isError || !recipe) return <div className="mx-auto max-w-3xl"><Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground no-underline"><ArrowLeft size={16} /> Collection</Link><Notice error><div className="flex items-center justify-between gap-4"><span>We couldn’t find this recipe.</span><button onClick={() => refetch()} className="font-semibold underline" data-testid="button-retry-recipe">Try again</button></div></Notice></div>;
  const doDelete = () => {
    deleteRecipe.mutate({ id }, {
      onSuccess: async () => {
        await Promise.all([
          client.invalidateQueries({ queryKey: getListRecipesQueryKey() }),
          client.invalidateQueries({ queryKey: getGetRecipeQueryKey(id) }),
        ]);
        toast.success('Recipe deleted.');
        navigate('/');
      },
    });
  };
  return (
    <div className="page-enter mx-auto max-w-4xl">
      <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground no-underline hover:text-foreground" data-testid="link-back-collection"><ArrowLeft size={16} /> All recipes</Link>
      <article className="overflow-hidden rounded-[28px] border border-card-border bg-card paper-shadow">
        <div className="relative border-b border-border bg-[#e8e4d3] px-6 py-8 sm:px-10 sm:py-11">
          <div className="absolute right-8 top-8 hidden rotate-3 rounded-md border border-[#bdad83] bg-[#f6edcf] px-3 py-2 text-xs font-serif italic text-[#746848] sm:block">from the recipe book</div>
          <span className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] ${categoryTint[recipe.category]}`}>{recipe.category}</span>
          <h1 className="mt-5 max-w-2xl font-serif text-[clamp(2.5rem,6vw,4.25rem)] font-semibold leading-[1] tracking-[-.055em] text-[#273a32]">{recipe.name}</h1>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[#536258]">
            <span className="inline-flex items-center gap-2"><Clock3 size={16} /> {recipe.cookingTimeMinutes} minutes</span>
            <span className="inline-flex items-center gap-2"><Utensils size={16} /> {recipe.ingredients.length} ingredients</span>
          </div>
          <div className="mt-7 flex flex-wrap gap-2">
            <Link href={`/recipes/${id}/edit`} className="inline-flex items-center gap-2 rounded-full bg-[#263d34] px-4 py-2.5 text-sm font-semibold text-[#f6f1e5] no-underline hover:bg-primary" data-testid="link-edit-recipe"><Edit3 size={15} /> Edit recipe</Link>
            <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-2 rounded-full border border-[#a9a898] bg-[#f6f3e9]/70 px-4 py-2.5 text-sm font-semibold text-[#5c6259] hover:border-red-300 hover:text-red-700" data-testid="button-delete-recipe"><Trash2 size={15} /> Delete</button>
          </div>
        </div>
        <div className="grid gap-8 px-6 py-8 sm:px-10 sm:py-10 md:grid-cols-[.82fr_1.18fr]">
          <section>
            <div className="mb-5 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-secondary-foreground"><Utensils size={17} /></span><h2 className="font-serif text-2xl font-semibold tracking-[-.03em]">What you’ll need</h2></div>
            <ul className="space-y-0 rounded-xl bg-[#f2efe4] px-4 py-2">
              {recipe.ingredients.map((ingredient, index) => <li key={`${ingredient}-${index}`} className="flex items-start gap-3 border-b border-[#ded8c6] py-3 text-sm leading-5 last:border-0" data-testid={`ingredient-${index}`}><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{ingredient}</li>)}
            </ul>
          </section>
          <section>
            <div className="mb-5 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#f0ded4] text-[#8e503d]"><ChefHat size={17} /></span><h2 className="font-serif text-2xl font-semibold tracking-[-.03em]">How it comes together</h2></div>
            <ol className="space-y-5">
              {recipe.steps.map((step, index) => <li key={`${step}-${index}`} className="flex gap-4" data-testid={`step-${index}`}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#d8c6a9] font-serif text-sm font-semibold text-[#9a533c]">{String(index + 1).padStart(2, '0')}</span><p className="pt-1 text-sm leading-6 text-foreground/85">{step}</p></li>)}
            </ol>
          </section>
        </div>
      </article>
      <div className="mt-5 flex justify-end text-[11px] text-muted-foreground">Last updated {new Date(recipe.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      {confirmDelete && <div className="fixed inset-0 z-50 grid place-items-center bg-[#1e2924]/55 p-5" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmDelete(false); }}>
        <div role="alertdialog" aria-modal="true" aria-labelledby="delete-title" className="w-full max-w-md rounded-[24px] border border-card-border bg-card p-6 paper-shadow">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-[#f2ded7] text-[#944c3b]"><Trash2 size={19} /></div>
          <h2 id="delete-title" className="mt-5 font-serif text-2xl font-semibold">Let this one go?</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">“{recipe.name}” will be removed from your collection. This can’t be undone.</p>
          {deleteRecipe.error && <p className="mt-3 text-sm text-red-700">{(deleteRecipe.error as Error).message || 'The recipe could not be deleted.'}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setConfirmDelete(false)} disabled={deleteRecipe.isPending} className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted" data-testid="button-cancel-delete">Keep recipe</button>
            <button onClick={doDelete} disabled={deleteRecipe.isPending} className="rounded-full bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60" data-testid="button-confirm-delete">{deleteRecipe.isPending ? 'Removing…' : 'Delete recipe'}</button>
          </div>
        </div>
      </div>}
    </div>
  );
}

function RecipeDetailRoute() {
  const [, params] = useRoute('/recipes/:id');
  if (!params?.id || params.id === 'new') return <NotFound />;
  return <RecipeDetails id={params.id} />;
}

function RecipeEditRoute() {
  const [, params] = useRoute('/recipes/:id/edit');
  const id = params?.id ?? '';
  const { data: recipe, isLoading, isError, refetch } = useGetRecipe(id);
  usePageMetadata('Edit a recipe | Recipe Book', 'Update the details for a saved recipe.');
  if (isLoading) return <RecipeLoading />;
  if (isError || !recipe) return <div className="mx-auto max-w-3xl"><Notice error><div className="flex items-center justify-between gap-4"><span>This recipe couldn’t be opened for editing.</span><button onClick={() => refetch()} className="font-semibold underline" data-testid="button-retry-edit">Try again</button></div></Notice></div>;
  return <RecipeForm key={recipe.id} initial={recipe} recipeId={recipe.id} />;
}

function NotFoundRoute() {
  usePageMetadata('Page not found | Recipe Book', 'That recipe-book page could not be found.');
  return <NotFound />;
}

function RoutedApp() {
  return <AppFrame><Switch>
    <Route path="/" component={CollectionPage} />
    <Route path="/recipes/new" component={NewRecipePage} />
    <Route path="/recipes/:id/edit" component={RecipeEditRoute} />
    <Route path="/recipes/:id" component={RecipeDetailRoute} />
    <Route component={NotFoundRoute} />
  </Switch></AppFrame>;
}

function App() {
  return <QueryClientProvider client={queryClient}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><RoutedApp /></WouterRouter><Toaster position="bottom-right" richColors /></QueryClientProvider>;
}

export default App;
