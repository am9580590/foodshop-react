import React, { useState, useEffect, createContext, useContext } from 'react';
import { Heart, ShoppingCart, Search, Plus, Minus, Trash2, X } from 'lucide-react';

// ============================================
// КОНТЕКСТ ПРИЛОЖЕНИЯ
// ============================================
const AppContext = createContext();

const useApp = () => useContext(AppContext);

// ============================================
// MOCK DATA (замени на fetch из menu.json)
// ============================================
const MOCK_DATA = {
  categories: [
    { id: "pashteti", name: "Паштети" },
    { id: "zakuski", name: "Закуски" },
    { id: "salaty", name: "Салаты" }
  ],
  menu: [
    {
      id: "48291",
      category: "pashteti",
      name: "Паштет з курячої печінки",
      price: [140, 100, 250, 100],
      images: "pashtet_1.jpg",
      units: "г",
      vote: "25"
    },
    {
      id: "92637",
      category: "salaty",
      name: "Олів'є класичний",
      price: [250, 100, 300, 100],
      images: "olivie.jpg",
      units: "г",
      vote: "10"
    }
  ],
  setCategories: [
    { id: "lunch", name: "Обідні сети" }
  ],
  sets: [
    {
      id: "27427",
      category: "lunch",
      name: "Обідній набір",
      images: "set_obid.jpg",
      items: ["48291", "92637"],
      vote: "10",
      description: "Ситний обід"
    }
  ]
};

// ============================================
// ХЕЛПЕРЫ
// ============================================
const parseProduct = (item) => {
  if (!item) return null;
  
  if (Array.isArray(item.price)) {
    const [priceValue, priceFor, recommended, step] = item.price;
    return {
      ...item,
      priceValue: Number(priceValue),
      priceFor: Number(priceFor),
      recommended: Number(recommended),
      step: Number(step),
      pricePerUnit: Number(priceValue) / Number(priceFor)
    };
  }
  return item;
};

// ============================================
// ПРОВАЙДЕР СОСТОЯНИЯ
// ============================================
const AppProvider = ({ children }) => {
  const [data, setData] = useState(MOCK_DATA);
  const [favorites, setFavorites] = useState(new Set());
  const [cart, setCart] = useState([]);
  const [currentTab, setCurrentTab] = useState('menu');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSet, setSelectedSet] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Загрузка из localStorage
  useEffect(() => {
    const savedFav = localStorage.getItem('favorites');
    const savedCart = localStorage.getItem('cart');
    
    if (savedFav) setFavorites(new Set(JSON.parse(savedFav)));
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  // Сохранение в localStorage
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify([...favorites]));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const addToCart = (product, quantity) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => 
          i.id === product.id 
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const updateCartQuantity = (id, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQuantity = item.quantity + delta;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => {
      const price = item.pricePerUnit 
        ? item.pricePerUnit * item.quantity
        : item.price * item.quantity;
      return sum + price;
    }, 0);
  };

  const getItemById = (id) => {
    const item = data.menu.find(i => i.id === id);
    return parseProduct(item);
  };

  return (
    <AppContext.Provider value={{
      data,
      favorites,
      cart,
      currentTab,
      selectedProduct,
      selectedSet,
      searchQuery,
      setCurrentTab,
      toggleFavorite,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      getCartTotal,
      getItemById,
      setSelectedProduct,
      setSelectedSet,
      setSearchQuery
    }}>
      {children}
    </AppContext.Provider>
  );
};

// ============================================
// КОМПОНЕНТЫ
// ============================================

// Верхнее меню
const TopNav = () => {
  const { currentTab, setCurrentTab, favorites, cart, searchQuery, setSearchQuery } = useApp();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="fixed top-0 left-0 right-0 bg-white z-50 shadow-sm">
      <div className="flex items-center gap-2 p-2 overflow-x-auto">
        {searchOpen ? (
          <div className="flex items-center gap-2 flex-1">
            <Search size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск..."
              className="flex-1 px-3 py-2 border rounded-full focus:outline-none"
              autoFocus
            />
            <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
              <X size={20} />
            </button>
          </div>
        ) : (
          <>
            <button onClick={() => setSearchOpen(true)} className="p-2">
              <Search size={20} />
            </button>
            
            <button
              onClick={() => setCurrentTab('menu')}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${
                currentTab === 'menu' 
                  ? 'bg-red-900 text-white font-semibold' 
                  : 'hover:bg-gray-100'
              }`}
            >
              Меню
            </button>
            
            <button
              onClick={() => setCurrentTab('sets')}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${
                currentTab === 'sets' 
                  ? 'bg-red-900 text-white font-semibold' 
                  : 'hover:bg-gray-100'
              }`}
            >
              Наборы
            </button>
            
            <button
              onClick={() => setCurrentTab('favorites')}
              className={`px-4 py-2 rounded-full whitespace-nowrap flex items-center gap-2 ${
                currentTab === 'favorites' 
                  ? 'bg-red-900 text-white font-semibold' 
                  : 'hover:bg-gray-100'
              }`}
            >
              Избранное
              {favorites.size > 0 && (
                <span className="bg-red-900 text-white rounded-full px-2 py-0.5 text-xs">
                  {favorites.size}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setCurrentTab('cart')}
              className={`px-4 py-2 rounded-full whitespace-nowrap flex items-center gap-2 ${
                currentTab === 'cart' 
                  ? 'bg-red-900 text-white font-semibold' 
                  : 'hover:bg-gray-100'
              }`}
            >
              Корзина
              {cart.length > 0 && (
                <span className="bg-red-900 text-white rounded-full px-2 py-0.5 text-xs">
                  {cart.length}
                </span>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// Карточка товара
const ProductCard = ({ item, isSet = false }) => {
  const { favorites, toggleFavorite, setSelectedProduct, setSelectedSet, getItemById, data } = useApp();
  const isFavorite = favorites.has(item.id);
  
  let displayPrice, displayWeight;
  
  if (isSet) {
    // Цена набора
    const total = item.items.reduce((sum, itemId) => {
      const product = getItemById(itemId);
      return product ? sum + (product.pricePerUnit * product.recommended) : sum;
    }, 0);
    displayPrice = Math.round(total) + ' грн';
    
    // Состав набора
    const itemNames = item.items.map(id => {
      const product = getItemById(id);
      return product?.name;
    }).filter(Boolean).join(', ');
    displayWeight = itemNames;
  } else {
    const parsed = parseProduct(item);
    if (parsed) {
      const totalPrice = Math.round(parsed.pricePerUnit * parsed.recommended);
      displayPrice = `${parsed.priceValue} за ${parsed.priceFor}${parsed.units}`;
      displayWeight = `${parsed.recommended}${parsed.units} на ${totalPrice} грн`;
    }
  }

  const handleClick = () => {
    if (isSet) {
      setSelectedSet(item);
    } else {
      setSelectedProduct(parseProduct(item));
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <div className="relative">
        <img 
          src={`images/${item.images}`} 
          alt={item.name}
          className="w-full h-48 object-cover rounded-lg"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(item.id);
          }}
          className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md"
        >
          <Heart 
            size={20} 
            className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}
          />
        </button>
      </div>
      
      <h3 className="font-semibold mt-3 text-lg">{item.name}</h3>
      <p className="text-gray-600 text-sm mt-1">{displayPrice}</p>
      <p className="text-gray-500 text-xs mt-1">{displayWeight}</p>
      
      {item.vote && (
        <div className="flex items-center gap-1 mt-2">
          <Heart size={14} className="text-red-500" />
          <span className="text-sm">{Number(item.vote) + (isFavorite ? 1 : 0)}</span>
        </div>
      )}
    </div>
  );
};

// Модалка товара
const ProductModal = () => {
  const { selectedProduct, setSelectedProduct, addToCart } = useApp();
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    if (selectedProduct) {
      setQuantity(selectedProduct.recommended);
    }
  }, [selectedProduct]);

  if (!selectedProduct) return null;

  const handleAdd = (delta) => {
    const newQty = quantity + (selectedProduct.step * delta);
    if (newQty >= selectedProduct.step) {
      setQuantity(newQty);
    }
  };

  const total = Math.round(selectedProduct.pricePerUnit * quantity);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <img 
            src={selectedProduct.image} 
            alt={selectedProduct.name}
            className="w-full h-64 object-cover"
          />
          <button
            onClick={() => setSelectedProduct(null)}
            className="absolute top-4 right-4 bg-white rounded-full p-2"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6">
          <h2 className="text-2xl font-bold">{selectedProduct.name}</h2>
          <p className="text-gray-600 mt-2">
            {selectedProduct.priceValue} грн за {selectedProduct.priceFor} {selectedProduct.units}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Рекомендуемое: {selectedProduct.recommended} {selectedProduct.units}
          </p>
          
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleAdd(-1)}
                className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center"
              >
                <Minus size={20} />
              </button>
              <span className="font-semibold text-lg">
                {quantity} {selectedProduct.units}
              </span>
              <button
                onClick={() => handleAdd(1)}
                className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center"
              >
                <Plus size={20} />
              </button>
            </div>
            
            <div className="text-right">
              <p className="font-bold text-xl">{total} грн</p>
              <button
                onClick={() => {
                  addToCart(selectedProduct, quantity);
                  setSelectedProduct(null);
                }}
                className="mt-2 bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700"
              >
                В корзину
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Модалка набора
const SetModal = () => {
  const { selectedSet, setSelectedSet, getItemById, addToCart } = useApp();
  const [setItems, setSetItems] = useState([]);

  useEffect(() => {
    if (selectedSet) {
      const items = selectedSet.items.map(itemId => {
        const product = getItemById(itemId);
        return product ? {
          product,
          quantity: product.recommended
        } : null;
      }).filter(Boolean);
      setSetItems(items);
    }
  }, [selectedSet]);

  if (!selectedSet) return null;

  const updateQuantity = (index, delta) => {
    setSetItems(prev => {
      const newItems = [...prev];
      const item = newItems[index];
      const newQty = item.quantity + (item.product.step * delta);
      
      if (newQty >= item.product.step) {
        newItems[index] = { ...item, quantity: newQty };
      }
      return newItems;
    });
  };

  const removeItem = (index) => {
    setSetItems(prev => prev.filter((_, i) => i !== index));
  };

  const total = setItems.reduce((sum, item) => 
    sum + Math.round(item.product.pricePerUnit * item.quantity), 0
  );

  const handleAddToCart = () => {
    setItems.forEach(item => {
      addToCart({
        id: item.product.id,
        name: item.product.name,
        priceValue: item.product.priceValue,
        priceFor: item.product.priceFor,
        pricePerUnit: item.product.pricePerUnit,
        step: item.product.step,
        units: item.product.units,
        image: `images/${item.product.images}`
      }, item.quantity);
    });
    setSelectedSet(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <img 
            src={`images/${selectedSet.images}`} 
            alt={selectedSet.name}
            className="w-full h-64 object-cover"
          />
          <button
            onClick={() => setSelectedSet(null)}
            className="absolute top-4 right-4 bg-white rounded-full p-2"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6">
          <h2 className="text-2xl font-bold">{selectedSet.name}</h2>
          <p className="text-gray-600 mt-2">{selectedSet.description}</p>
          
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Товары в наборе:</h3>
            
            {setItems.map((item, index) => {
              const itemTotal = Math.round(item.product.pricePerUnit * item.quantity);
              const willBeMin = item.quantity - item.product.step < item.product.step;
              
              return (
                <div key={index} className="flex justify-between items-center py-3 border-b">
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.product.priceValue} грн за {item.product.priceFor} {item.product.units}
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      {item.quantity} {item.product.units} = {itemTotal} грн
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => willBeMin ? removeItem(index) : updateQuantity(index, -1)}
                      className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center"
                    >
                      {willBeMin ? <Trash2 size={16} /> : <Minus size={16} />}
                    </button>
                    <span className="w-12 text-center text-sm">
                      {item.quantity} {item.product.units}
                    </span>
                    <button
                      onClick={() => updateQuantity(index, 1)}
                      className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 flex justify-between items-center">
            <p className="text-xl font-bold">{total} грн</p>
            <button
              onClick={handleAddToCart}
              className="bg-green-600 text-white px-8 py-3 rounded-full hover:bg-green-700"
            >
              В корзину
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Страница меню
const MenuPage = () => {
  const { data, searchQuery } = useApp();
  
  const filteredMenu = searchQuery
    ? data.menu.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : data.menu;

  if (searchQuery && filteredMenu.length === 0) {
    return (
      <div className="p-4 mt-16">
        <h2 className="text-2xl font-bold mb-4">Результаты поиска</h2>
        <p className="text-gray-500">Ничего не найдено</p>
      </div>
    );
  }

  if (searchQuery) {
    return (
      <div className="p-4 mt-16 pb-20">
        <h2 className="text-2xl font-bold mb-4">Результаты поиска</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredMenu.map(item => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-16 pb-20">
      {data.categories.map(category => {
        const items = data.menu.filter(item => item.category === category.id);
        if (items.length === 0) return null;
        
        return (
          <div key={category.id} className="p-4">
            <h2 className="text-2xl font-bold mb-4">{category.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map(item => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Страница наборов
const SetsPage = () => {
  const { data } = useApp();

  return (
    <div className="mt-16 pb-20">
      {data.setCategories.map(category => {
        const sets = data.sets.filter(set => set.category === category.id);
        if (sets.length === 0) return null;
        
        return (
          <div key={category.id} className="p-4">
            <h2 className="text-2xl font-bold mb-4">{category.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sets.map(set => (
                <ProductCard key={set.id} item={set} isSet={true} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Страница избранного
const FavoritesPage = () => {
  const { data, favorites } = useApp();
  
  const favItems = data.menu.filter(item => favorites.has(item.id));
  const favSets = data.sets.filter(set => favorites.has(set.id));

  if (favItems.length === 0 && favSets.length === 0) {
    return (
      <div className="mt-16 p-4">
        <h2 className="text-2xl font-bold mb-4">Избранное</h2>
        <p className="text-gray-500">Пусто</p>
      </div>
    );
  }

  return (
    <div className="mt-16 p-4 pb-20">
      <h2 className="text-2xl font-bold mb-4">Избранное</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {favItems.map(item => (
          <ProductCard key={item.id} item={item} />
        ))}
        {favSets.map(set => (
          <ProductCard key={set.id} item={set} isSet={true} />
        ))}
      </div>
    </div>
  );
};

// Страница корзины
const CartPage = () => {
  const { cart, updateCartQuantity, removeFromCart, getCartTotal } = useApp();

  if (cart.length === 0) {
    return (
      <div className="mt-16 p-4">
        <h2 className="text-2xl font-bold mb-4">Корзина</h2>
        <p className="text-gray-500">Пусто</p>
      </div>
    );
  }

  const total = Math.round(getCartTotal());

  return (
    <div className="mt-16 pb-32">
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Корзина</h2>
        
        {cart.map(item => {
          const itemTotal = item.pricePerUnit 
            ? Math.round(item.pricePerUnit * item.quantity)
            : Math.round(item.price * item.quantity);
          
          const step = item.step || 1;
          const showTrash = item.quantity <= step;
          
          const priceText = item.pricePerUnit
            ? `${item.priceValue} грн за ${item.priceFor} ${item.units}`
            : `${item.price} грн`;

          return (
            <div key={item.id} className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex gap-4">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-gray-500">{priceText}</p>
                  <p className="font-bold mt-2">{itemTotal} грн</p>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => showTrash ? removeFromCart(item.id) : updateCartQuantity(item.id, -step)}
                  className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center"
                >
                  {showTrash ? <Trash2 size={18} /> : <Minus size={18} />}
                </button>
                <span className="font-semibold">
                  {item.quantity} {item.units}
                </span>
                <button
                  onClick={() => updateCartQuantity(item.id, step)}
                  className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4">
        <p className="text-xl font-bold mb-3">Итого: {total} грн</p>
        <button className="w-full bg-green-600 text-white py-3 rounded-full font-semibold hover:bg-green-700">
          Купить
        </button>
      </div>
    </div>
  );
};

// ============================================
// ГЛАВНЫЙ КОМПОНЕНТ
// ============================================
export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <Main />
        <ProductModal />
        <SetModal />
      </div>
    </AppProvider>
  );
}

const Main = () => {
  const { currentTab } = useApp();
  
  switch(currentTab) {
    case 'menu': return <MenuPage />;
    case 'sets': return <SetsPage />;
    case 'favorites': return <FavoritesPage />;
    case 'cart': return <CartPage />;
    default: return <MenuPage />;
  }
};