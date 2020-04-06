let _selectedDom
let _elementsCount
const _callbacks = new Map()

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
		this.dom = null
	}
}

class Navigator {
	static tree
	static idToElement
	static EVENT_ANY = 'navigator_event_any'
	
	static init () {
		window.removeEventListener('keyup', handleKeyUp)
		window.addEventListener('keyup', handleKeyUp)
		Navigator.idToElement = new Map()
		Navigator.tree = {}
		_elementsCount = 0
		_selectedDom = null
	}
	
	static subscribe (callback, events) {
		const mapCallbackToEvent = (e, c) => {
			if (_callbacks.has(e)) _callbacks.get(e).push(c)
			else _callbacks.set(e, [c])
		}
		if (events instanceof Array) {
			events.forEach(e => mapCallbackToEvent(e, callback))
		} else if (typeof (events) === 'string' || events instanceof String) {
			mapCallbackToEvent(events, callback)
		} else {
			mapCallbackToEvent(Navigator.EVENT_ANY, callback)
		}
	}
	
	static unsubscribe (callback, events) {
		const removeCallback = (e, c) => {
			if (_callbacks.has(e)) {
				if (c) {
					const methods = _callbacks.get(e)
					methods.splice(methods.indexOf(c), 1)
				} else _callbacks.delete(e)
			}
		}
		if (typeof (callback) === 'string' || callback instanceof String) {
			removeCallback(callback)
		} else if (callback instanceof Array) callback.forEach((e) => removeCallback(e))
		else {
			if (events) {
				if (events instanceof Array) events.forEach((e) => removeCallback(e, callback))
				else if (typeof (events) === 'string' || events instanceof String) {
					removeCallback(events, callback)
				}
			} else removeCallback(Navigator.EVENT_ANY, callback)
		}
	}
	
	static findElementByID (id) {
		let element
		if (id) {
			if (Navigator.idToElement.has(id)) element = Navigator.idToElement.get(id) // look in cache
			else Navigator.idToElement.set(id, (element = findElement(id, Navigator.tree))) // cache
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
	
	static unregisterFocusElement (parent, child) {
		if (parent) {
			const parentElement = findElement(parent, Navigator.tree)
			if (parentElement) delete parentElement[child]
			if (Navigator.idToElement && Navigator.idToElement.has(child)) {
				Navigator.idToElement.delete(child)
			}
		}
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

function focusElement (currentDom, nextDom) {
	if (currentDom && currentDom.classList.contains('focus')) {
		currentDom.classList.remove('focus')
	}
	nextDom.focus({ preventScroll: true })
	nextDom.classList.add('focus')
}

function applyToElementParents (element, action) {
	while (element && element.pid && element.id) {
		element = Navigator.findElementByID(element.pid)
		element.pid && action(element.dom)
	}
}

function removeSelectClassOnParents (element) {
	// console.log('> Navigator: removeSelectClassToDomWithId')
	applyToElementParents(element, (domElement) => domElement.classList.remove('selected'))
}

function addSelectClassOnParent (element) {
	// console.log('> Navigator: addSelectClassToDomWithId')
	applyToElementParents(element, (domElement) => domElement.classList.add('selected'))
}

const findNavigationOwnerUp = (from, direction, criteria) => {
	let navigationOwner = from
	while (navigationOwner && navigationOwner.navigate &&
	(!navigationOwner.navigate[direction] || criteria(navigationOwner))) {
		navigationOwner = Navigator.findElementByID(navigationOwner.pid)
		// console.log('\t\tfindNavigationOwner:', navigationOwner)
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
	// console.log('\tfindNextElementWithRule: parentElement =', parentElement)
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
	const eventKey = e.key
	const navigation = NAVIGATIONS[eventKey]
	if (navigation) {
		const nextElement = _selectedDom ? findNextElementWithRules(
			Navigator.findElementByID(_selectedDom.id),
			navigation.direction,
			navigation.parentSelectionRule,
			navigation.nextIndexRule,
		) : Navigator.findFirstElement()
		
		if (nextElement) {
			focusElement(_selectedDom, nextElement.dom)
			_selectedDom = nextElement.dom
		}
		console.log(e.key, '> nextElement =', nextElement, Navigator.tree)
	}
	
	if (_callbacks.has(eventKey)) {
		_callbacks.get(eventKey).forEach(c =>
			c(eventKey, Navigator.findElementByID(_selectedDom?.id)))
	}
	if (_callbacks.has(Navigator.EVENT_ANY)) {
		_callbacks.get(Navigator.EVENT_ANY).forEach(c =>
			c(eventKey, Navigator.findElementByID(_selectedDom?.id)))
	}
}

Navigator.install = function (Vue) {
	Vue.directive('focus', {
		bind: (element, binding, vnode) => {
			const that = vnode.componentInstance
			const componentParentId = that.$parent.$options.name + that.$parent._uid
			const componentNameId = that.$options.name + that._uid
			const navigate = vnode.data.directives.find(dir => dir.arg === 'navigate')
			element.id = componentNameId
			element.tabIndex = _elementsCount++
			// console.log('> bind: ', componentNameId)
			const item = Navigator.registerFocusElement(componentParentId, componentNameId)
			item.navigate = navigate ? navigate.modifiers : {}
			item.dom = element
		}
	})
	Vue.directive('selected', {
		bind: (element, binding, vnode) => {
			focusElement(_selectedDom, element)
			_selectedDom = element
			// console.log('> Navigator: selected =', _selectedDom)
			addSelectClassOnParent(Navigator.findElementByID(element.id))
		},
	})
}

export default Navigator
