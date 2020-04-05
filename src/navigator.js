let _selectedDom
let _elementsCount

function findElement (id, parentElement) { // level can be removed
	if (!parentElement) return null
	else if (parentElement.hasOwnProperty(id)) {
		return parentElement[id]
	} else {
		for (const key in parentElement) {
			if (key === id) return parentElement[key]
			else if (parentElement[key] instanceof Element) {
				return findElement(id, parentElement[key])
			}
		}
	}
	return null
}

class Element {
	constructor (id, pid, numChildren, index) {
		this.id = id
		this.pid = pid
		this.numChildren = numChildren
		this.index = index
		this.inArray = false
		this.first = false
		this.last = false
	}
}

class Navigator {
	static tree
	static idToElement
	
	static init () {
		window.removeEventListener('keyup', handleKeyUp)
		window.addEventListener('keyup', handleKeyUp)
		Navigator.idToElement = new Map()
		Navigator.tree = {}
		_elementsCount = 0
		_selectedDom = null
	}
	
	static findElementByID (id) {
		let element
		if (Navigator.idToElement.has(id)) {
			element = Navigator.idToElement.get(id)
		} else {
			element = findElement(id, Navigator.tree)
			Navigator.idToElement.set(id, element)
		}
		return element
	}
	
	static findFirstElement () {
		const firstElementName = Object.keys(Navigator.tree)[0]
		if (!firstElementName) return null
		let result = Navigator.tree[firstElementName]
		while (result.numChildren > 0) {
			console.log('> findFirstElement -> result:', result)
			result = result[result.children[0]]
		}
		return result
	}
	
	static registerFocusElement (parent, child) {
		if (parent) {
			let parentElement = findElement(parent, Navigator.tree)
			let childElement
			if (parentElement) {
				childElement = findElement(child, Navigator.tree)
				if (childElement) {
					if (Navigator.tree[child]) delete Navigator.tree[child]
					childElement.pid = parent
					parentElement[child] = childElement
				} else {
					// console.log('\t\tnew child: '+ child, parent)
					childElement = parentElement[child] = new Element(child, parent, 0, parentElement.numChildren || 0)
				}
				parentElement.numChildren = parentElement.numChildren ? parentElement.numChildren + 1 : 1
				if (!parentElement.children) parentElement.children = []
				childElement.index = parentElement.children.length
				childElement.inArray = true
				childElement.last = true
				parentElement[parentElement.children[parentElement.children.length - 1]].last = false
				parentElement.children.push(child)
			} else {
				childElement = findElement(child, Navigator.tree)
				parentElement = Navigator.tree[parent] || (Navigator.tree[parent] = {})
				if (childElement && Navigator.tree[child]) {
					childElement.pid = parent
					childElement.index = 0
					delete Navigator.tree[child]
				} else {
					childElement = new Element(child, parent, 0, 0)
				}
				childElement.inArray = true
				childElement.last = true
				childElement.first = true
				parentElement[child] = childElement
				parentElement.numChildren = 1
				parentElement.children = [child]
				parentElement.id = parent
				parentElement.selectedIndex = 0
				// console.log("\t\tno parent: " + parent, child, parentNode)
			}
			Navigator.idToElement.set(child, childElement)
			return childElement
		} else if (!Navigator.tree[child]) {
			Navigator.tree[child] = new Element(child, 'root', 0, 0)
			return Navigator.tree[child]
		}
	}
}

function focusElement (next) {
	next.focus({ preventScroll: false })
}

function applyToElementParents(element, action) {
	do {
		element = Navigator.findElementByID(element.pid)
		element.pid && action(document.getElementById(element.id))
	} while (element.pid)
}

function removeSelectClassOnParents (element) {
	console.log('> Navigator: removeSelectClassToDomWithId')
	applyToElementParents(element, (domElement) => domElement.classList.remove('selected'))
}

function addSelectClassOnParent (element) {
	console.log('> Navigator: addSelectClassToDomWithId')
	applyToElementParents(element, (domElement) => domElement.classList.add('selected'))
}

const findNavigationOwnerUp = (from, direction, criteria) => {
	let navigationOwner = from
	while (navigationOwner && navigationOwner.navigate &&
	(!navigationOwner.navigate[direction] || criteria(navigationOwner))) {
		navigationOwner = Navigator.findElementByID(navigationOwner.pid)
		console.log('\t\tfindNavigationOwner:', navigationOwner)
	}
	return navigationOwner
}

const findLastSelectedChild = (from, selectedIndex) => {
	let nextElement = from
	let iterations = 0
	let index = selectedIndex
	let childIndex = 0
	while (nextElement && nextElement.numChildren > 0) {
		iterations++
		// This part needed only to set same selectedIndex when "keepid" exists on navigation owner
		childIndex = iterations === 1
			? (index = selectedIndex < nextElement.numChildren
				? selectedIndex : nextElement.numChildren - 1)
			: nextElement.selectedIndex
		nextElement = nextElement[nextElement.children[childIndex]]
	}
	return {
		nextElement,
		index,
		childIndex,
	}
}

const findNextElementWithRules = (element, direction, parentSelectionRule, nextIndexRule) => {
	const navigationOwner = findNavigationOwnerUp(element, direction, parentSelectionRule)
	const parentElement = navigationOwner ? Navigator.findElementByID(navigationOwner.pid) : null
	console.log('\tfindNextElementWithRule: parentElement =', parentElement)
	if (parentElement) {
		const children = parentElement.children
		const parentSelectedIndex = parentElement.selectedIndex
		const parentNextChildIndex = nextIndexRule(parentSelectedIndex)
		// console.log('\t\t| parent ChildIndex | SelectedIndex =', element.index)
		// console.log('\t\t| parent SelectedIndex =', parentSelectedIndex)
		// console.log('\t\t| parent NextChildIndex =', parentNextChildIndex)
		if (parentNextChildIndex > parentSelectedIndex
			? parentNextChildIndex < children.length
			: parentNextChildIndex >= 0) {
			const keepid = navigationOwner.navigate.keepid // use same selected index for first next parent child
			const nextParentElement = parentElement[children[parentNextChildIndex]]
			const firstSelectedChildIndex = keepid ? navigationOwner.selectedIndex : nextParentElement.selectedIndex
			const { nextElement, index } = findLastSelectedChild(nextParentElement, firstSelectedChildIndex)
			if (nextElement) {
				parentElement.selectedIndex = parentNextChildIndex
				nextParentElement.selectedIndex = index
				// console.log('\t\t| nextElement.pid | element.pid =', nextElement.pid, element.pid)
				if (nextElement.pid !== element.pid) {
					// console.log('\t\t| navigationOwner parentElement !== nextParentElement:', (parentElement !== nextParentElement))
					removeSelectClassOnParents(element)
					addSelectClassOnParent(nextElement)
				}
				// console.log('\t\t| next parent SelectedIndex =', nextParentElement.index)
				// console.log('\t\t| next parent ChildIndex =', nextParentElement.selectedIndex)
				return nextElement
			}
		}
	}
	return null
}

class NavigationOptions {
	constructor (direction, parentSelectionRule, nextIndexRule) {
		this.direction = direction
		this.parentSelectionRule = parentSelectionRule
		this.nextIndexRule = nextIndexRule
	}
}

const NAVIGATIONS = {
	ArrowDown: new NavigationOptions('down', (item) => item.inArray && item.last, (index) => index + 1),
	ArrowUp: new NavigationOptions('up', (item) => item.inArray && item.first, (index) => index - 1),
	ArrowRight: new NavigationOptions('right', (item) => item.inArray && item.last, (index) => index + 1),
	ArrowLeft: new NavigationOptions('left', (item) => item.inArray && item.first, (index) => index - 1),
}

function handleKeyUp (e) {
	const navigation = NAVIGATIONS[e.key]
	if (navigation) {
		const nextElement = _selectedDom ? findNextElementWithRules(
			Navigator.findElementByID(_selectedDom.id),
			navigation.direction,
			navigation.parentSelectionRule,
			navigation.nextIndexRule,
		) : Navigator.findFirstElement()
		
		if (nextElement) {
			const nextDom = document.getElementById(nextElement.id)
			if (nextDom) {
				focusElement(nextDom)
				_selectedDom = nextDom
			}
		}
		console.log(e.key, '> nextElement =', nextElement, Navigator.tree)
	}
}

Navigator.install = function (Vue, options) {
	Vue.directive('focus', {
		// directive lifecycle
		bind: (element, binding, vnode) => {
			const that = vnode.componentInstance
			const componentParentId = that.$parent.$options.name + that.$parent._uid
			const componentNameId = that.$options.name + that._uid
			const navigate = vnode.data.directives.find(dir => dir.arg === 'navigate')
			element.id = componentNameId
			element.tabIndex = _elementsCount++
			// console.log('> mounter -> element: ', componentNameId, componentParentId)
			const item = Navigator.registerFocusElement(componentParentId, componentNameId)
			item.navigate = navigate ? navigate.modifiers : {}
		},
		unbind: (element, binding, vnode) => {
		},
	})
	Vue.directive('selected', {
		bind: (element, binding, vnode) => {
			focusElement(element)
			_selectedDom = element
			addSelectClassOnParent(Navigator.findElementByID(element.id))
		},
		unbind: (element, binding, vnode) => {
		},
	})
}

export default Navigator
