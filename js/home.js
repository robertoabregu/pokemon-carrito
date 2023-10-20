// Cargar los Pokémon desde la API
async function loadPokemon () {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=20');
    const data = await response.json();
    const pokemonContainer = document.getElementById('pokemon-container');

    data.results.forEach(async (pokemon) => {
        const response = await fetch(pokemon.url);
        const data = await response.json();
        const pokemonCard = document.createElement('div');
        pokemonCard.className = 'pokemon-card';
        pokemonCard.innerHTML = `
            <img src="${data.sprites.other["official-artwork"].front_default}" alt="${data.name}">
            <h3>${data.name}</h3>
            <p>Tipo: ${data.types[0].type.name}</p>
            <p>Valor: $<span class="pokemon-value">${calculatePokemonValue(data)}</span></p>
            <button onclick="addToCart('${data.name}', ${calculatePokemonValue(data)})" type="button" class="button">
            <span class="button__text">Agregar</span>
            <span class="button__icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" viewBox="0 0 24 24" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" stroke="currentColor" height="24" fill="none" class="svg"><line y2="19" y1="5" x2="12" x1="12"></line><line y2="12" y1="12" x2="19" x1="5"></line></svg></span>
            </button>
        `;
        pokemonContainer.appendChild(pokemonCard);
    });
}

// Calcular el valor del Pokémon según su tipo
function calculatePokemonValue (pokemonData) {
    const type = pokemonData.types[0].type.name;
    if (type === 'electric') {
        return 50;
    } else if (type === 'water') {
        return 40;
    } else if (type === 'fire') {
        return 20;
    } else if (type === 'grass') {
        return 10;
    } else {
        return 30;
    }
}

// Cargar los Pokémon al cargar la página
loadPokemon();


// Objeto para rastrear los elementos del carrito
const cartItemsMap = new Map();

// Abrir el modal del carrito
function openCartModal () {
    const cartModal = document.getElementById('cart-modal');
    cartModal.style.display = 'flex';
    setTimeout(function () {
        cartModal.classList.add('active');
    }, 50);

    // Agrega un evento de clic al fondo oscuro del modal
    cartModal.addEventListener('click', function (event) {
        if (event.target === cartModal) {
            closeCartModal();
        }
    });
}

// Cerrar el modal del carrito
function closeCartModal () {
    const cartModal = document.getElementById('cart-modal');
    cartModal.classList.remove('active');
    setTimeout(function () {
        cartModal.style.display = 'none';
    }, 500);
}

// Agregar un Pokémon al carrito
function addToCart (pokemonName, pokemonValue) {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    // Verificar si el elemento ya está en el carrito
    if (cartItemsMap.has(pokemonName)) {
        const existingItem = cartItemsMap.get(pokemonName);
        existingItem.quantity += 1;
        existingItem.element.querySelector('.quantity').textContent = `x${existingItem.quantity}`;

        // Recalcula el valor total del Pokémon en función de la cantidad
        const itemTotalValue = existingItem.quantity * pokemonValue;
        existingItem.element.querySelector('.item-total').textContent = `$${itemTotalValue.toFixed(2)}`;
    } else {
        // Si no está en el carrito, crea un nuevo elemento
        const cartItem = document.createElement('li');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <span>${pokemonName} <span class="quantity">x1</span></span>
            <button class="remove-btn" id="remove-${pokemonName}">-</button>
            <span class="item-total">$${pokemonValue.toFixed(2)}</span>
        `;
        cartItems.appendChild(cartItem);

        // Agregar el elemento al mapa del carrito
        cartItemsMap.set(pokemonName, {
            element: cartItem,
            quantity: 1,
            value: pokemonValue
        });

        // Controlador de eventos para el botón de eliminación
        const removeButton = document.getElementById(`remove-${pokemonName}`);
        removeButton.addEventListener('click', () => removeFromCart(pokemonName, pokemonValue));
    }

    // Sumar el valor del Pokémon al total del carrito
    const currentTotal = parseFloat(cartTotal.textContent);
    cartTotal.textContent = (currentTotal + pokemonValue).toFixed(2);

    // Actualizar el localStorage
    updateLocalStorage();
}

// Quitar un Pokémon del carrito
function removeFromCart (pokemonName, pokemonValue) {
    if (cartItemsMap.has(pokemonName)) {
        const existingItem = cartItemsMap.get(pokemonName);
        if (existingItem.quantity > 1) {
            // Si la cantidad es mayor que 1, disminuye la cantidad
            existingItem.quantity -= 1;
            existingItem.element.querySelector('.quantity').textContent = `x${existingItem.quantity}`;

            // Recalcula el subtotal del valor por ítem
            const itemTotalValue = existingItem.quantity * pokemonValue;
            existingItem.element.querySelector('.item-total').textContent = `$${itemTotalValue.toFixed(2)}`;
        } else {
            // Si la cantidad es 1, elimina el elemento del carrito
            const cartItems = document.getElementById('cart-items');
            cartItems.removeChild(existingItem.element);
            cartItemsMap.delete(pokemonName);
        }

        // Restar el valor del Pokémon eliminado del total del carrito
        const cartTotal = document.getElementById('cart-total');
        const currentTotal = parseFloat(cartTotal.textContent);
        cartTotal.textContent = (currentTotal - pokemonValue).toFixed(2);
    }

    // Actualizar el localStorage
    updateLocalStorage();
}

// Cargar el carrito desde el localStorage al cargar la página
async function loadCartFromLocalStorage () {
    const cartData = JSON.parse(localStorage.getItem('cartData'));
    if (cartData) {
        for (const itemName of cartData) {
            if (typeof itemName === 'string') {
                try {
                    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${itemName}`);
                    if (response.status === 200) {
                        const data = await response.json();
                        const itemValue = calculatePokemonValue(data);
                        addToCart(itemName, itemValue);
                    } else {
                        console.error(`Error al cargar el Pokémon ${itemName}: ${response.statusText}`);
                    }
                } catch (error) {
                    console.error(`Error al cargar el Pokémon ${itemName}:`, error);
                }
            } else {
                console.error(`Nombre de Pokémon no válido en el localStorage: ${itemName}`);
            }
        }
    }
}

function updateLocalStorage () {
    const validCartData = Array.from(cartItemsMap.keys()).filter(item => typeof item === 'string');
    localStorage.setItem('cartData', JSON.stringify(validCartData));
}

// Cargar el carrito desde el localStorage
window.addEventListener('load', loadCartFromLocalStorage);

// Clic al botón de abrir el carrito
const openCartButton = document.getElementById('open-cart-button');
openCartButton.addEventListener('click', openCartModal);

// Clic al botón de cerrar el carrito en el modal
const closeCartButton = document.getElementById('close-cart-button');
closeCartButton.addEventListener('click', closeCartModal);
