import './style.css'
import {fetchData, postData, deleteData, editData} from './apiCalls'
import {showStatus} from './errorHandling'

//Sections, buttons, text
const itemsView = document.querySelector("#items-view")
const merchantsView = document.querySelector("#merchants-view")
const merchantsNavButton = document.querySelector("#merchants-nav")
const itemsNavButton = document.querySelector("#items-nav")
const addNewButton = document.querySelector("#add-new-button")
const showingText = document.querySelector("#showing-text")

//Form elements
const merchantForm = document.querySelector("#new-merchant-form")
const newMerchantName = document.querySelector("#new-merchant-name")
const itemForm = document.querySelector("#new-item-form")
const submitMerchantButton = document.querySelector("#submit-merchant")
const submitItemButton = document.querySelector("#submit-item")

// Event Listeners
merchantsView.addEventListener('click', (event) => {
  handleMerchantClicks(event)
})

merchantsNavButton.addEventListener('click', showMerchantsView)
itemsNavButton.addEventListener('click', showItemsView)

addNewButton.addEventListener('click', () => {
  if (addNewButton.dataset.state === 'merchant') {
    show([merchantForm])
    hide([itemForm])
  }
  else if (addNewButton.dataset.state === 'item') {
    show([itemForm])
    hide([merchantForm])
  }
})

submitMerchantButton.addEventListener('click', (event) => {
  submitMerchant(event)
})

submitItemButton.addEventListener('click', (event) => {
  submitItem(event)
})

//Global variables
let merchants;
let items;

//Page load data fetching
Promise.all([fetchData('merchants'), fetchData('items')])
.then(responses => {
    merchants = responses[0].data
    items = responses[1].data
    displayMerchants(merchants)
  })
  .catch(err => {
    console.log('catch error: ', err)
  })

// Merchant CRUD Functions
function handleMerchantClicks(event) {
  if (event.target.classList.contains("delete-merchant")) {
    deleteMerchant(event)
  } else if (event.target.classList.contains("edit-merchant")) {
    editMerchant(event)
  } else if (event.target.classList.contains("view-merchant-items")) {
    displayMerchantItems(event)
  } else if (event.target.classList.contains("submit-merchant-edits")) {
    submitMerchantEdits(event)
  } else if (event.target.classList.contains("discard-merchant-edits")) {
    discardMerchantEdits(event)
  }
}

function deleteMerchant(event) {
  const id = event.target.closest("article").id.split('-')[1]
  deleteData(`merchants/${id}`)
    .then(() => {
      let deletedMerchant = findMerchant(id)
      let indexOfMerchant = merchants.indexOf(deletedMerchant)
      merchants.splice(indexOfMerchant, 1)
      displayMerchants(merchants)
      showStatus('Success! Merchant removed!', true)
    })
}

function editMerchant(event) {
  const article = event.target.closest("article")
  const h3Name = article.firstElementChild
  const editInput = article.querySelector(".edit-merchant-input")
  const submitEditsButton = article.querySelector(".submit-merchant-edits")
  const discardEditsButton = article.querySelector(".discard-merchant-edits")
  editInput.value = h3Name.innerText
  show([editInput, submitEditsButton, discardEditsButton])
}

function submitMerchantEdits(event) {
  event.preventDefault();
  const article = event.target.closest("article")
  const editInput = article.querySelector(".edit-merchant-input")
  const merchantNameElement = article.querySelector(".merchant-name");
  const id = article.id.split('-')[1]
  const patchBody = { name: editInput.value }

  merchantNameElement.textContent = patchBody.name;

  hide([editInput, article.querySelector(".submit-merchant-edits"), article.querySelector(".discard-merchant-edits")]);
  show([merchantNameElement]);

  editData(`merchants/${id}`, patchBody)
    .then(patchResponse => {
      let merchantToUpdate = findMerchant(patchResponse.data.id)
      let indexOfMerchant = merchants.indexOf(merchantToUpdate)
      merchants.splice(indexOfMerchant, 1, patchResponse.data)
      displayMerchants(merchants)
      showStatus('Success! Merchant updated!', true)
    })
}

function discardMerchantEdits(event) {
  const article = event.target.closest("article")
  const editInput = article.querySelector(".edit-merchant-input")
  const submitEditsButton = article.querySelector(".submit-merchant-edits")
  const discardEditsButton = article.querySelector(".discard-merchant-edits")

  editInput.value = ""
  hide([editInput, submitEditsButton, discardEditsButton])
}

function submitMerchant(event) {
  event.preventDefault()
  var merchantName = newMerchantName.value
  postData('merchants', { name: merchantName })
    .then(postedMerchant => {
      merchants.push(postedMerchant.data)
      displayAddedMerchant(postedMerchant.data)
      newMerchantName.value = ''
      showStatus('Success! Merchant added!', true)
      hide([merchantForm]) 
    })
}

function submitItem(event) {
  event.preventDefault()
  var newItem = {
    name: newItemName.value,
    description: newItemDescription.value,
    unit_price: parseFloat(newItemPrice.value)
  }
  postData('items', newItem)
  .then(postedItem => {
    items.push(postedItem.data)
    displayAddedItem(postedItem.data)
    newItemName.value = ''
    newItemPrice.value = ''
    showStatus('Success! Item added!', true)
    hide([itemForm])
  })
}

// Functions that control the view 
function showMerchantsView() {
  showingText.innerText = "All Merchants"
  addRemoveActiveNav(merchantsNavButton, itemsNavButton)
  addNewButton.dataset.state = 'merchant'
  show([merchantsView, addNewButton])
  hide([itemsView])
  displayMerchants(merchants)
}

function showItemsView() {
  showingText.innerText = "All Items"
  addRemoveActiveNav(itemsNavButton, merchantsNavButton)
  addNewButton.dataset.state = 'item'
  show([itemsView, addNewButton])
  hide([merchantsView, merchantForm, itemForm])
  displayItems(items)
}

function showMerchantItemsView(id, items) {
  showingText.innerText = `All Items for Merchant #${id}`
  show([itemsView])
  hide([merchantsView, addNewButton])
  addRemoveActiveNav(itemsNavButton, merchantsNavButton)
  addNewButton.dataset.state = 'item'
  displayItems(items)
}

// Functions that add data to the DOM
function displayItems(items) {
  itemsView.innerHTML = ''

  if(items.length == 0){
      itemsView.innerHTML += 'No Items Yet For This Merchant.'
  } else {
    let firstHundredItems = items.slice(0, 99)
    firstHundredItems.forEach(item => {
      let merchant = findMerchant(item.attributes.merchant_id).attributes.name
      itemsView.innerHTML += `
          <article class="item" id="item-${item.id}">
            <h2 class="item-name">${item.attributes.name}</h2>
            <p class="item-description">${item.attributes.description}</p>
            <p class="item-price">$${item.attributes.unit_price}</p>
            <p class="merchant-name-in-item">Merchant: ${merchant}</p>
          </article>
      `
    })
  }
}

function displayMerchants(merchants) {
    merchantsView.innerHTML = ''
    merchants.forEach(merchant => {
        merchantsView.innerHTML += 
        `<article class="merchant" id="merchant-${merchant.id}">
          <h3 class="merchant-name">${merchant.attributes.name}</h3>
          <div>
            <button class="view-merchant-items">View Merchant Items</button>
            <button class="edit-merchant icon">✎</button>
            <input class="edit-merchant-input hidden" name="edit-merchant" type="text">
            <button class="submit-merchant-edits hidden">
              Submit Edits
            </button>
            <button class="discard-merchant-edits hidden">
              Discard Edits
            </button>
            <button class="delete-merchant icon">🗑️</button>
          </div>
        </article>`
    })
}

function displayAddedMerchant(merchant) {
      merchantsView.insertAdjacentHTML('beforeend', 
      `<article class="merchant" id="merchant-${merchant.id}">
          <h3 class="merchant-name">${merchant.attributes.name}</h3>
          <div>
            <button class="view-merchant-items">View Merchant Items</button>
            <button class="edit-merchant icon">✎</button>
            <input class="edit-merchant-input hidden" name="edit-merchant" type="text">
            <button class="submit-merchant-edits hidden">
              Submit Edits
            </button>
            <button class="discard-merchant-edits hidden">
              Discard Edits
            </button>
            <button class="delete-merchant icon">🗑️</button>
          </div>
        </article>`)
}

function displayMerchantItems(event) {
  let merchantId = event.target.closest("article").id.split('-')[1]
  const filteredMerchantItems = filterByMerchant(merchantId)
  showMerchantItemsView(merchantId, filteredMerchantItems)
}

//Helper Functions
function show(elements) {
  elements.forEach(element => {
    element.classList.remove('hidden')
  })
}

function hide(elements) {
  elements.forEach(element => {
    element.classList.add('hidden')
  })
}

function addRemoveActiveNav(nav1, nav2) {
  nav1.classList.add('active-nav')
  nav2.classList.remove('active-nav')
}

function filterByMerchant(merchantId) {
  return items.filter(item => item.attributes.merchant_id === parseInt(merchantId))
}

function findMerchant(id) {
  return merchants.find(merchant => parseInt(merchant.id) === parseInt(id))
}
