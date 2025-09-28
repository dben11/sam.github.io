import { useState, useEffect } from "react";

// API Base URL - This needs to match your Flask backend's URL
const API_BASE_URL = "http://127.0.0.1:5000";

// A simple API Service Layer to handle all HTTP requests
const api = {
  fetchRecipes: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/recipes`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch recipes:", error);
      return [];
    }
  },
  createRecipe: async (recipe) => {
    const response = await fetch(`${API_BASE_URL}/recipes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(recipe),
    });
    if (!response.ok) {
      throw new Error("Failed to create recipe");
    }
    return await response.json();
  },
  updateRecipe: async (id, updatedData) => {
    const response = await fetch(`${API_BASE_URL}/recipes/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedData),
    });
    if (!response.ok) {
      throw new Error("Failed to update recipe");
    }
    return await response.json();
  },
  deleteRecipe: async (id) => {
    const response = await fetch(`${API_BASE_URL}/recipes/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete recipe");
    }
    // No content expected for a 204 status
  },
};

// Main App Component
function App() {
  const [recipes, setRecipes] = useState([]);
  const [currentView, setCurrentView] = useState("list");
  const [formData, setFormData] = useState({
    title: "",
    ingredients: "",
    instructions: "",
  });
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  // NEW: State for the search query
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchAllRecipes = async () => {
      setLoading(true);
      const data = await api.fetchRecipes();
      setRecipes(data);
      setLoading(false);
    };
    fetchAllRecipes();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === "ingredients") {
      setFormData({ ...formData, [name]: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const ingredientsList = formData.ingredients
        .split("\n")
        .filter((i) => i.trim() !== "");

      const recipeData = {
        title: formData.title,
        ingredients: ingredientsList,
        instructions: formData.instructions,
      };

      if (selectedRecipe && selectedRecipe.id) {
        const updatedRecipe = await api.updateRecipe(
          selectedRecipe.id,
          recipeData
        );
        setRecipes(
          recipes.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r))
        );
        setMessage("Recipe updated successfully!");
      } else {
        const newRecipe = await api.createRecipe(recipeData);
        setRecipes([...recipes, newRecipe]);
        setMessage("Recipe created successfully!");
      }
      setFormData({ title: "", ingredients: "", instructions: "" });
      setSelectedRecipe(null);
      setCurrentView("list");
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setMessage("");
    try {
      await api.deleteRecipe(id);
      setRecipes(recipes.filter((r) => r.id !== id));
      setMessage("Recipe deleted successfully!");
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (recipe) => {
    setFormData({
      title: recipe.title,
      ingredients: recipe.ingredients.join("\n"),
      instructions: recipe.instructions,
    });
    setSelectedRecipe(recipe);
    setCurrentView("form");
  };

  // NEW: Filter the recipes based on the search query
  const filteredRecipes = recipes.filter((recipe) => {
    const query = searchQuery.toLowerCase();
    const titleMatch = recipe.title.toLowerCase().includes(query);
    const ingredientsMatch = recipe.ingredients.some((ingredient) =>
      ingredient.toLowerCase().includes(query)
    );
    return titleMatch || ingredientsMatch;
  });

  const renderView = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-blue-500"></div>
        </div>
      );
    }

    if (currentView === "form") {
      return (
        <RecipeForm
          formData={formData}
          onChange={handleFormChange}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setCurrentView("list");
            setSelectedRecipe(null);
            setFormData({ title: "", ingredients: "", instructions: "" });
          }}
          isEdit={!!selectedRecipe}
        />
      );
    }

    if (currentView === "detail") {
      return (
        <RecipeDetail
          recipe={selectedRecipe}
          onBack={() => {
            setCurrentView("list");
            setSelectedRecipe(null);
          }}
          onDelete={() => handleDelete(selectedRecipe.id)}
          onEdit={() => handleEdit(selectedRecipe)}
        />
      );
    }

    return (
      <RecipeList
        // NEW: Pass the filtered list and the search-related props
        recipes={filteredRecipes}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectRecipe={(recipe) => {
          setSelectedRecipe(recipe);
          setCurrentView("detail");
        }}
        onAddRecipe={() => {
          setCurrentView("form");
          setSelectedRecipe(null);
          setFormData({ title: "", ingredients: "", instructions: "" });
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-8 font-sans">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-4xl min-h-[700px]">
        {/* UPDATED: Title with gradient styling */}
        {/* NEW: The logo is an inline SVG with Tailwind classes */}
        <div className="flex justify-center mb-4">
          <svg
            className="w-16 h-16 text-blue-600"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2a5 5 0 0 0-5 5c0 1.954.914 3.702 2.348 4.887L6 18.068V20h12v-1.932l-3.348-6.181A5 5 0 0 0 17 7a5 5 0 0 0-5-5zm0 2a3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3z" />
          </svg>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-center mb-10">
          Recipe App
        </h1>
        {message && (
          <div className="text-center p-3 mb-4 rounded-lg text-white bg-blue-500 font-medium">
            {message}
          </div>
        )}
        {renderView()}
      </div>
    </div>
  );
}

// Sub-component for the Recipe List view
// UPDATED: Now accepts search-related props
const RecipeList = ({
  recipes,
  searchQuery,
  setSearchQuery,
  onSelectRecipe,
  onAddRecipe,
  onEdit,
  onDelete,
}) => (
  <div className="flex flex-col">
    <div className="flex flex-col sm:flex-row justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
      {/* NEW: The search bar input field */}
      <input
        type="text"
        placeholder="Search recipes by title or ingredient..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full sm:flex-grow px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={onAddRecipe}
        className="px-6 py-2 bg-green-600 text-white rounded-full font-semibold shadow-lg hover:bg-green-700 transition duration-300 transform hover:scale-105"
      >
        Add New Recipe
      </button>
    </div>
    <ul className="space-y-4">
      {recipes.length > 0 ? (
        recipes.map((recipe) => (
          <li
            key={recipe.id}
            className="p-6 bg-gray-50 rounded-lg shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between transition-all duration-300 hover:shadow-md"
          >
            <span
              className="text-lg font-medium text-gray-700 cursor-pointer flex-grow-0 sm:flex-grow truncate"
              onClick={() => onSelectRecipe(recipe)}
              title={recipe.title}
            >
              {recipe.title}
            </span>
            <div className="flex items-center space-x-2 mt-4 sm:mt-0 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(recipe);
                }}
                className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-300"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (
                    window.confirm(
                      "Are you sure you want to delete this recipe?"
                    )
                  ) {
                    onDelete(recipe.id);
                  }
                }}
                className="px-4 py-1.5 text-sm bg-red-500 text-white rounded-full hover:bg-red-600 transition duration-300"
              >
                Delete
              </button>
            </div>
          </li>
        ))
      ) : (
        <p className="text-center text-gray-500">
          No recipes found. Try a different search!
        </p>
      )}
    </ul>
  </div>
);

// Sub-component for the Recipe Form view (Add/Edit)
const RecipeForm = ({ formData, onChange, onSubmit, onCancel, isEdit }) => (
  <form onSubmit={onSubmit} className="flex flex-col space-y-6">
    <h2 className="text-2xl font-bold text-gray-700 text-center">
      {isEdit ? "Edit Recipe" : "Add New Recipe"}
    </h2>
    <div>
      <label
        htmlFor="title"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Title
      </label>
      <input
        type="text"
        id="title"
        name="title"
        value={formData.title}
        onChange={onChange}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="e.g., Spaghetti Carbonara"
        required
      />
    </div>
    <div>
      <label
        htmlFor="ingredients"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Ingredients (one per line)
      </label>
      <textarea
        id="ingredients"
        name="ingredients"
        value={formData.ingredients}
        onChange={onChange}
        rows="5"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        placeholder="e.g.,\n1 pound spaghetti\n4 large eggs\n2 cups grated Parmesan cheese"
        required
      ></textarea>
    </div>
    <div>
      <label
        htmlFor="instructions"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Instructions
      </label>
      <textarea
        id="instructions"
        name="instructions"
        value={formData.instructions}
        onChange={onChange}
        rows="8"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        placeholder="e.g.,\n1. Cook the pasta according to package directions...\n2. Whisk the eggs and cheese together..."
        required
      ></textarea>
    </div>
    <div className="flex justify-center space-x-4">
      <button
        type="submit"
        className="px-6 py-2 bg-blue-600 text-white rounded-full font-semibold shadow-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105"
      >
        {isEdit ? "Update Recipe" : "Save Recipe"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-6 py-2 bg-gray-500 text-white rounded-full font-semibold shadow-lg hover:bg-gray-600 transition duration-300 transform hover:scale-105"
      >
        Cancel
      </button>
    </div>
  </form>
);

// Sub-component for the Recipe Detail view
const RecipeDetail = ({ recipe, onBack, onDelete, onEdit }) => (
  <div className="flex flex-col space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-3xl font-bold text-gray-800">{recipe.title}</h2>
      <button
        onClick={onBack}
        className="px-4 py-1.5 text-sm bg-gray-400 text-white rounded-full hover:bg-gray-500 transition duration-300"
      >
        Back to List
      </button>
    </div>

    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Ingredients
        </h3>
        <ul className="list-disc list-inside space-y-1 text-gray-600 pl-4">
          {recipe.ingredients.map((ingredient, index) => (
            <li key={index}>{ingredient}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Instructions
        </h3>
        <p className="text-gray-600 whitespace-pre-wrap">
          {recipe.instructions}
        </p>
      </div>
    </div>

    <div className="flex justify-center space-x-4 mt-6">
      <button
        onClick={onEdit}
        className="px-6 py-2 bg-blue-600 text-white rounded-full font-semibold shadow-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105"
      >
        Edit Recipe
      </button>
      <button
        onClick={() => {
          if (window.confirm("Are you sure you want to delete this recipe?")) {
            onDelete();
          }
        }}
        className="px-6 py-2 bg-red-600 text-white rounded-full font-semibold shadow-lg hover:bg-red-700 transition duration-300 transform hover:scale-105"
      >
        Delete Recipe
      </button>
    </div>
  </div>
);

export default App;
