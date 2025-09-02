class FruitBusinessSystem {
  constructor() {
    this.data = {
      warehouse: JSON.parse(localStorage.getItem("warehouse")) || {},
      transactions: JSON.parse(localStorage.getItem("transactions")) || [],
      suppliers: JSON.parse(localStorage.getItem("suppliers")) || {},
      customers: JSON.parse(localStorage.getItem("customers")) || {},
    }

    this.init()
  }

  init() {
    this.setupNavigation()
    this.setupForms()
    this.updateDashboard()
    this.updateWarehouse()
    this.updateSalesForm()
    this.updateArchive()
    this.updateContacts()
    this.setupReports()
  }

  setupNavigation() {
    const menuToggle = document.getElementById("menuToggle")
    const sidebar = document.getElementById("sidebar")
    const overlay = document.getElementById("overlay")
    const closeSidebar = document.getElementById("closeSidebar")
    const navLinks = document.querySelectorAll(".nav-link")
    const sections = document.querySelectorAll(".section")

    const openSidebar = () => {
      sidebar.classList.add("open")
      overlay.classList.add("active")
      document.body.style.overflow = "hidden"
    }

    const closeSidebarFn = () => {
      sidebar.classList.remove("open")
      overlay.classList.remove("active")
      document.body.style.overflow = ""
    }

    menuToggle.addEventListener("click", openSidebar)
    closeSidebar.addEventListener("click", closeSidebarFn)
    overlay.addEventListener("click", closeSidebarFn)

    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        const targetSection = link.dataset.section

        // Update active nav link
        navLinks.forEach((l) => l.classList.remove("active"))
        link.classList.add("active")

        // Update active section
        sections.forEach((s) => s.classList.remove("active"))
        document.getElementById(targetSection).classList.add("active")

        // Close sidebar on mobile
        closeSidebarFn()

        // Update data when switching sections
        if (targetSection === "warehouse") this.updateWarehouse()
        if (targetSection === "sales") this.updateSalesForm()
        if (targetSection === "archive") this.updateArchive()
        if (targetSection === "contacts") this.updateContacts()
        if (targetSection === "dashboard") this.updateDashboard()
      })
    })
  }

  setupForms() {
    // Purchase form
    const purchaseForm = document.getElementById("purchaseForm")
    const quantityInput = document.getElementById("quantity")
    const priceInput = document.getElementById("purchasePrice")
    const totalCostSpan = document.getElementById("totalCost")

    const updateTotalCost = () => {
      const quantity = Number.parseFloat(quantityInput.value) || 0
      const price = Number.parseFloat(priceInput.value) || 0
      const total = quantity * price
      totalCostSpan.textContent = this.formatCurrency(total)
    }

    quantityInput.addEventListener("input", updateTotalCost)
    priceInput.addEventListener("input", updateTotalCost)

    purchaseForm.addEventListener("submit", (e) => {
      e.preventDefault()
      this.handlePurchase()
    })

    // Sales form
    const salesForm = document.getElementById("salesForm")
    const saleProductSelect = document.getElementById("saleProduct")
    const saleQuantityInput = document.getElementById("saleQuantity")
    const salePriceInput = document.getElementById("salePrice")

    saleProductSelect.addEventListener("change", () => {
      this.updateProductInfo()
    })

    const updateSaleCalculation = () => {
      this.updateSaleCalculation()
    }

    saleQuantityInput.addEventListener("input", updateSaleCalculation)
    salePriceInput.addEventListener("input", updateSaleCalculation)

    salesForm.addEventListener("submit", (e) => {
      e.preventDefault()
      this.handleSale()
    })

    // Contacts tabs
    const tabBtns = document.querySelectorAll(".tab-btn")
    const tabContents = document.querySelectorAll(".tab-content")

    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetTab = btn.dataset.tab

        tabBtns.forEach((b) => b.classList.remove("active"))
        btn.classList.add("active")

        tabContents.forEach((t) => t.classList.remove("active"))
        document.getElementById(targetTab).classList.add("active")
      })
    })
  }

  handlePurchase() {
    const productName = document.getElementById("productName").value.trim()
    const quantity = Number.parseFloat(document.getElementById("quantity").value)
    const purchasePrice = Number.parseFloat(document.getElementById("purchasePrice").value)
    const supplier = document.getElementById("supplier").value.trim()
    const supplierPhone = document.getElementById("supplierPhone").value.trim()
    const vehicleNumber = document.getElementById("vehicleNumber").value.trim()

    if (!productName || !quantity || !purchasePrice || !supplier) {
      this.showMessage("Barcha majburiy maydonlarni to'ldiring!", "error")
      return
    }

    const totalCost = quantity * purchasePrice
    const transaction = {
      id: Date.now(),
      type: "purchase",
      productName,
      quantity,
      price: purchasePrice,
      total: totalCost,
      supplier,
      supplierPhone,
      vehicleNumber,
      date: new Date().toISOString(),
      dateString: new Date().toLocaleDateString("uz-UZ"),
    }

    // Add to warehouse
    if (this.data.warehouse[productName]) {
      const currentQuantity = this.data.warehouse[productName].quantity
      const currentTotal = this.data.warehouse[productName].totalCost
      const newQuantity = currentQuantity + quantity
      const newTotal = currentTotal + totalCost

      this.data.warehouse[productName] = {
        quantity: newQuantity,
        averagePrice: newTotal / newQuantity,
        totalCost: newTotal,
        lastUpdated: new Date().toISOString(),
      }
    } else {
      this.data.warehouse[productName] = {
        quantity,
        averagePrice: purchasePrice,
        totalCost,
        lastUpdated: new Date().toISOString(),
      }
    }

    // Add supplier
    this.data.suppliers[supplier] = {
      name: supplier,
      phone: supplierPhone,
      lastTransaction: new Date().toISOString(),
    }

    // Add transaction
    this.data.transactions.push(transaction)

    this.saveData()
    this.showMessage("Xarid muvaffaqiyatli qo'shildi!", "success")
    document.getElementById("purchaseForm").reset()
    document.getElementById("totalCost").textContent = "0 so'm"
    this.updateDashboard()
    this.updateWarehouse()
    this.updateSalesForm()
  }

  handleSale() {
    const productName = document.getElementById("saleProduct").value
    const saleQuantity = Number.parseFloat(document.getElementById("saleQuantity").value)
    const salePrice = Number.parseFloat(document.getElementById("salePrice").value)
    const customer = document.getElementById("customer").value.trim()
    const customerPhone = document.getElementById("customerPhone").value.trim()
    const deliveryVehicle = document.getElementById("deliveryVehicle").value.trim()

    if (!productName || !saleQuantity || !salePrice || !customer) {
      this.showMessage("Barcha majburiy maydonlarni to'ldiring!", "error")
      return
    }

    const warehouseItem = this.data.warehouse[productName]
    if (!warehouseItem || warehouseItem.quantity < saleQuantity) {
      this.showMessage("Omborxonada yetarli mahsulot yo'q!", "error")
      return
    }

    const totalSale = saleQuantity * salePrice
    const totalCost = saleQuantity * warehouseItem.averagePrice
    const profit = totalSale - totalCost

    const transaction = {
      id: Date.now(),
      type: "sale",
      productName,
      quantity: saleQuantity,
      price: salePrice,
      total: totalSale,
      cost: totalCost,
      profit,
      customer,
      customerPhone,
      deliveryVehicle,
      date: new Date().toISOString(),
      dateString: new Date().toLocaleDateString("uz-UZ"),
    }

    // Update warehouse
    this.data.warehouse[productName].quantity -= saleQuantity
    this.data.warehouse[productName].totalCost -= totalCost

    if (this.data.warehouse[productName].quantity <= 0) {
      delete this.data.warehouse[productName]
    }

    // Add customer
    this.data.customers[customer] = {
      name: customer,
      phone: customerPhone,
      lastTransaction: new Date().toISOString(),
    }

    // Add transaction
    this.data.transactions.push(transaction)

    this.saveData()
    this.showMessage(`Sotish muvaffaqiyatli! Foyda: ${this.formatCurrency(profit)}`, "success")
    document.getElementById("salesForm").reset()
    this.updateDashboard()
    this.updateWarehouse()
    this.updateSalesForm()
    this.updateSaleCalculation()
  }

  updateDashboard() {
    const totalWarehouseValue = Object.values(this.data.warehouse).reduce((sum, item) => sum + item.totalCost, 0)

    const today = new Date().toDateString()
    const todayTransactions = this.data.transactions.filter((t) => new Date(t.date).toDateString() === today)

    const todaySales = todayTransactions.filter((t) => t.type === "sale").reduce((sum, t) => sum + t.total, 0)
    const todayProfit = todayTransactions.filter((t) => t.type === "sale").reduce((sum, t) => sum + t.profit, 0)
    const totalProducts = Object.keys(this.data.warehouse).length

    document.getElementById("totalWarehouseValue").textContent = this.formatCurrency(totalWarehouseValue)
    document.getElementById("todaySales").textContent = this.formatCurrency(todaySales)
    document.getElementById("todayProfit").textContent = this.formatCurrency(todayProfit)
    document.getElementById("totalProducts").textContent = totalProducts

    const headerProfit = document.getElementById("todayProfitHeader")
    if (todayProfit > 0) {
      headerProfit.textContent = `+${this.formatCurrency(todayProfit)}`
      headerProfit.style.background = "var(--success)"
    } else if (todayProfit < 0) {
      headerProfit.textContent = this.formatCurrency(todayProfit)
      headerProfit.style.background = "var(--danger)"
    } else {
      headerProfit.textContent = "0"
      headerProfit.style.background = "var(--gray-400)"
    }

    const recentActivities = this.data.transactions
      .slice(-10)
      .reverse()
      .map((t) => {
        const time = new Date(t.date).toLocaleTimeString("uz-UZ", {
          hour: "2-digit",
          minute: "2-digit",
        })

        if (t.type === "purchase") {
          return `
            <div class="activity-item">
              <div>
                <strong>Xarid:</strong> ${t.productName} - ${t.quantity}kg
                <br><small>Yetkazib beruvchi: ${t.supplier}</small>
                ${t.vehicleNumber ? `<br><small>Fura: ${t.vehicleNumber}</small>` : ""}
              </div>
              <div class="activity-time">${time}</div>
            </div>
          `
        } else {
          return `
            <div class="activity-item">
              <div>
                <strong>Sotish:</strong> ${t.productName} - ${t.quantity}kg
                <br><small>Xaridor: ${t.customer} | Foyda: ${this.formatCurrency(t.profit)}</small>
                ${t.deliveryVehicle ? `<br><small>Fura: ${t.deliveryVehicle}</small>` : ""}
              </div>
              <div class="activity-time">${time}</div>
            </div>
          `
        }
      })
      .join("")

    document.getElementById("recentActivities").innerHTML =
      recentActivities || '<p style="text-align: center; color: var(--gray-500);">Hozircha faoliyat yo\'q</p>'
  }

  updateWarehouse() {
    const warehouseList = document.getElementById("warehouseList")
    const warehouseTotalValue = document.getElementById("warehouseTotalValue")

    const totalValue = Object.values(this.data.warehouse).reduce((sum, item) => sum + item.totalCost, 0)

    warehouseTotalValue.textContent = this.formatCurrency(totalValue)

    if (Object.keys(this.data.warehouse).length === 0) {
      warehouseList.innerHTML = '<p style="text-align: center; color: var(--gray-500);">Omborxona bo\'sh</p>'
      return
    }

    const warehouseHTML = Object.entries(this.data.warehouse)
      .map(
        ([productName, item]) => `
                <div class="warehouse-item">
                    <h3>${productName}</h3>
                    <p class="quantity">Miqdor: ${item.quantity} kg</p>
                    <p>O'rtacha narx: ${this.formatCurrency(item.averagePrice)}/kg</p>
                    <p class="value">Umumiy qiymat: ${this.formatCurrency(item.totalCost)}</p>
                    <p><small>Oxirgi yangilanish: ${new Date(item.lastUpdated).toLocaleString("uz-UZ")}</small></p>
                </div>
            `,
      )
      .join("")

    warehouseList.innerHTML = warehouseHTML
  }

  updateSalesForm() {
    const saleProductSelect = document.getElementById("saleProduct")
    const currentValue = saleProductSelect.value

    saleProductSelect.innerHTML = '<option value="">Mahsulot tanlang</option>'

    Object.keys(this.data.warehouse).forEach((productName) => {
      const option = document.createElement("option")
      option.value = productName
      option.textContent = `${productName} (${this.data.warehouse[productName].quantity} kg)`
      saleProductSelect.appendChild(option)
    })

    if (currentValue && this.data.warehouse[currentValue]) {
      saleProductSelect.value = currentValue
      this.updateProductInfo()
    }
  }

  updateProductInfo() {
    const productName = document.getElementById("saleProduct").value
    const productInfo = document.getElementById("productInfo")

    if (!productName || !this.data.warehouse[productName]) {
      productInfo.style.display = "none"
      return
    }

    const item = this.data.warehouse[productName]
    document.getElementById("availableQuantity").textContent = item.quantity
    document.getElementById("productPurchasePrice").textContent = this.formatCurrency(item.averagePrice)
    productInfo.style.display = "block"

    this.updateSaleCalculation()
  }

  updateSaleCalculation() {
    const productName = document.getElementById("saleProduct").value
    const saleQuantity = Number.parseFloat(document.getElementById("saleQuantity").value) || 0
    const salePrice = Number.parseFloat(document.getElementById("salePrice").value) || 0

    if (!productName || !this.data.warehouse[productName]) {
      document.getElementById("totalSaleAmount").textContent = "0 so'm"
      document.getElementById("totalCostAmount").textContent = "0 so'm"
      document.getElementById("profitAmount").textContent = "0 so'm"
      return
    }

    const item = this.data.warehouse[productName]
    const totalSale = saleQuantity * salePrice
    const totalCost = saleQuantity * item.averagePrice
    const profit = totalSale - totalCost

    document.getElementById("totalSaleAmount").textContent = this.formatCurrency(totalSale)
    document.getElementById("totalCostAmount").textContent = this.formatCurrency(totalCost)
    document.getElementById("profitAmount").textContent = this.formatCurrency(profit)

    const profitElement = document.getElementById("profitAmount").parentElement
    if (profit > 0) {
      profitElement.style.color = "var(--success)"
    } else if (profit < 0) {
      profitElement.style.color = "var(--danger)"
    } else {
      profitElement.style.color = "var(--gray-500)"
    }
  }

  updateArchive() {
    const archiveList = document.getElementById("archiveList")
    const archiveFilter = document.getElementById("archiveFilter")
    const archiveDate = document.getElementById("archiveDate")

    const filterTransactions = () => {
      let filtered = [...this.data.transactions]

      const filterType = archiveFilter.value
      if (filterType !== "all") {
        filtered = filtered.filter((t) => t.type === filterType)
      }

      const filterDate = archiveDate.value
      if (filterDate) {
        const selectedDate = new Date(filterDate).toDateString()
        filtered = filtered.filter((t) => new Date(t.date).toDateString() === selectedDate)
      }

      return filtered.reverse()
    }

    const renderArchive = () => {
      const transactions = filterTransactions()

      if (transactions.length === 0) {
        archiveList.innerHTML = '<p style="text-align: center; color: var(--gray-500);">Tranzaksiya topilmadi</p>'
        return
      }

      const archiveHTML = transactions
        .map((t) => {
          if (t.type === "purchase") {
            return `
              <div class="archive-item purchase">
                <h4>Xarid - ${t.productName}</h4>
                <p><strong>Miqdor:</strong> ${t.quantity} kg</p>
                <p><strong>Narx:</strong> ${this.formatCurrency(t.price)}/kg</p>
                <p><strong>Umumiy:</strong> ${this.formatCurrency(t.total)}</p>
                <p><strong>Yetkazib beruvchi:</strong> ${t.supplier}</p>
                ${t.supplierPhone ? `<p><strong>Telefon:</strong> ${t.supplierPhone}</p>` : ""}
                ${t.vehicleNumber ? `<p><strong>Fura raqami:</strong> ${t.vehicleNumber}</p>` : ""}
                <p><strong>Sana:</strong> ${new Date(t.date).toLocaleString("uz-UZ")}</p>
              </div>
            `
          } else {
            return `
              <div class="archive-item sale">
                <h4>Sotish - ${t.productName}</h4>
                <p><strong>Miqdor:</strong> ${t.quantity} kg</p>
                <p><strong>Sotish narxi:</strong> ${this.formatCurrency(t.price)}/kg</p>
                <p><strong>Umumiy sotish:</strong> ${this.formatCurrency(t.total)}</p>
                <p><strong>Xarajat:</strong> ${this.formatCurrency(t.cost)}</p>
                <p><strong>Foyda:</strong> <span style="color: ${t.profit >= 0 ? "var(--success)" : "var(--danger)"}">${this.formatCurrency(t.profit)}</span></p>
                <p><strong>Xaridor:</strong> ${t.customer}</p>
                ${t.customerPhone ? `<p><strong>Telefon:</strong> ${t.customerPhone}</p>` : ""}
                ${t.deliveryVehicle ? `<p><strong>Yetkazib berish furasi:</strong> ${t.deliveryVehicle}</p>` : ""}
                <p><strong>Sana:</strong> ${new Date(t.date).toLocaleString("uz-UZ")}</p>
              </div>
            `
          }
        })
        .join("")

      archiveList.innerHTML = archiveHTML
    }

    archiveFilter.addEventListener("change", renderArchive)
    archiveDate.addEventListener("change", renderArchive)

    renderArchive()
  }

  updateContacts() {
    const suppliersList = document.getElementById("suppliersList")
    const customersList = document.getElementById("customersList")

    const suppliersHTML = Object.values(this.data.suppliers)
      .map(
        (supplier) => `
                <div class="contact-item">
                    <h4>${supplier.name}</h4>
                    ${supplier.phone ? `<p>📞 ${supplier.phone}</p>` : ""}
                    <p><small>Oxirgi tranzaksiya: ${new Date(supplier.lastTransaction).toLocaleDateString("uz-UZ")}</small></p>
                </div>
            `,
      )
      .join("")

    suppliersList.innerHTML =
      suppliersHTML || '<p style="text-align: center; color: var(--gray-500);">Yetkazib beruvchilar yo\'q</p>'

    const customersHTML = Object.values(this.data.customers)
      .map(
        (customer) => `
                <div class="contact-item">
                    <h4>${customer.name}</h4>
                    ${customer.phone ? `<p>📞 ${customer.phone}</p>` : ""}
                    <p><small>Oxirgi tranzaksiya: ${new Date(customer.lastTransaction).toLocaleDateString("uz-UZ")}</small></p>
                </div>
            `,
      )
      .join("")

    customersList.innerHTML =
      customersHTML || '<p style="text-align: center; color: var(--gray-500);">Xaridorlar yo\'q</p>'
  }

  setupReports() {
    const generateReportBtn = document.getElementById("generateReport")
    const reportPeriod = document.getElementById("reportPeriod")

    generateReportBtn.addEventListener("click", () => {
      this.generateReport()
    })

    this.generateReport() // Initial report
  }

  generateReport() {
    const period = document.getElementById("reportPeriod").value
    let filteredTransactions = [...this.data.transactions]

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (period) {
      case "today":
        filteredTransactions = filteredTransactions.filter(
          (t) => new Date(t.date).toDateString() === today.toDateString(),
        )
        break
      case "week":
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        filteredTransactions = filteredTransactions.filter((t) => new Date(t.date) >= weekAgo)
        break
      case "month":
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
        filteredTransactions = filteredTransactions.filter((t) => new Date(t.date) >= monthAgo)
        break
    }

    const sales = filteredTransactions.filter((t) => t.type === "sale")
    const purchases = filteredTransactions.filter((t) => t.type === "purchase")

    const totalSales = sales.reduce((sum, t) => sum + t.total, 0)
    const totalCosts = purchases.reduce((sum, t) => sum + t.total, 0)
    const totalProfit = sales.reduce((sum, t) => sum + t.profit, 0)
    const totalTransactions = filteredTransactions.length

    document.getElementById("reportSales").textContent = this.formatCurrency(totalSales)
    document.getElementById("reportCosts").textContent = this.formatCurrency(totalCosts)
    document.getElementById("reportProfit").textContent = this.formatCurrency(totalProfit)
    document.getElementById("reportTransactions").textContent = totalTransactions
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat("uz-UZ").format(Math.round(amount)) + " so'm"
  }

  showMessage(message, type) {
    const messageDiv = document.createElement("div")
    messageDiv.className = `${type}-message`
    messageDiv.textContent = message

    const main = document.querySelector(".main-content")
    main.insertBefore(messageDiv, main.firstChild)

    setTimeout(() => {
      messageDiv.remove()
    }, 5000)
  }

  saveData() {
    localStorage.setItem("warehouse", JSON.stringify(this.data.warehouse))
    localStorage.setItem("transactions", JSON.stringify(this.data.transactions))
    localStorage.setItem("suppliers", JSON.stringify(this.data.suppliers))
    localStorage.setItem("customers", JSON.stringify(this.data.customers))
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new FruitBusinessSystem()
})
