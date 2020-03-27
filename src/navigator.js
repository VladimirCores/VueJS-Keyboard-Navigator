let _selectedDom;

function findElement(id, currentNode) { // level can be removed
	if (!currentNode) {
		return null;
	} else if (currentNode[id]) return currentNode[id];
	else {
		for (const key in currentNode) {
			if (key === id) return currentNode[key];
			else if (currentNode[key] instanceof Element) {
				// console.log('findNode > key = ', level, id, key)
				const res = findElement(id, currentNode[key]);
				if (res) return res;
			}
		}
		return null;
	}
}

class Element
{
	constructor(id, pid, numChildren, index) {
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
	static tree = {};
	static idtoelement = new Map();
	static init() {
		window.removeEventListener("keyup", handleKeyUp);
		window.addEventListener("keyup", handleKeyUp);
		Navigator.tree = {};
	}
	
	static findElementByID(id) {
		let element
		if (Navigator.idtoelement.has(id))
			element = Navigator.idtoelement.get(id)
		else {
			element = findElement(id, Navigator.tree)
			Navigator.idtoelement.set(id, element)
		}
		return element
	}
	
	static registerFocusElement(parent, child) {
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
				}
				else childElement = new Element(child, parent, 0, 0)
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
			Navigator.idtoelement.set(child, childElement)
			return childElement
		} else if (!Navigator.tree[child]) {
			Navigator.tree[child] = new Element(child, 'root', 0, 0)
			return Navigator.tree[child]
		}
	}
}

function selectElement(prev, next) {
	if (prev != null) prev.classList.remove("selected")
	next.classList.add("selected")
}

const findNavigationOwnerUp = (from, direction, criteria) => {
	let navigationOwner = from
	while (navigationOwner && navigationOwner.navigate
		&& (!navigationOwner.navigate[direction]
			|| (criteria && criteria(navigationOwner)))) {
		navigationOwner = Navigator.findElementByID(navigationOwner.pid)
		console.log('\t\tfindNavigationOwner:',navigationOwner)
	}
	return navigationOwner
}
const findLastSelectedChild = (from, selectedIndex) => {
	let next = from
	let iterations = 0, index = selectedIndex, childIndex = 0
	while (next && next.numChildren > 0) {
		iterations++
		let children = next.children
		// This part needed only to set same selectedIndex when "keepid" exists on navigation owner
		childIndex = iterations === 1 ?
			(index = selectedIndex < children.length ? selectedIndex : children.length - 1)
			: next.selectedIndex
		next = next[children[childIndex]]
	}
	return { next, index, childIndex }
}
const findNextElementWithCriterias = (element, direction, parentSelectionCriteria, nextIndexCriteria) => {
	let navigationOwner = findNavigationOwnerUp(element, direction, parentSelectionCriteria)
	let parentElement = navigationOwner ? Navigator.findElementByID(navigationOwner.pid) : null
	console.log('\tfindNextElementWithCriterias: parentElement =', parentElement)
	if (parentElement) {
		let children = parentElement.children
		let parentSelectedIndex = parentElement.selectedIndex
		let parentNextChildIndex = nextIndexCriteria(parentSelectedIndex)
		console.log('\t\t| parent ChildIndex =', element.index)
		console.log('\t\t| parent SelectedIndex =', parentSelectedIndex)
		console.log('\t\t| parent NextChildIndex =', parentNextChildIndex)
		if (parentNextChildIndex > parentSelectedIndex ?
			parentNextChildIndex < children.length :
			parentNextChildIndex >= 0)
		{
			let keepid = navigationOwner.navigate.keepid // use same selected index for first next parent child
			let nextParentElement = parentElement[children[parentNextChildIndex]]
			let firstSelectedChildIndex = keepid ? navigationOwner.selectedIndex : nextParentElement.selectedIndex
			let { next, index, childIndex } = findLastSelectedChild(nextParentElement, firstSelectedChildIndex)
			console.log('\t\t| navigationOwner keepid =', keepid)
			if (next) {
				nextParentElement.selectedIndex = index
				parentElement.selectedIndex = parentNextChildIndex
				console.log('\t\t| next parent SelectedIndex =', nextParentElement.index)
				console.log('\t\t| next parent ChildIndex =', nextParentElement.selectedIndex)
				console.log('\t\t| selected child index =', childIndex)
				return next
			}
		}
	}
	return null
}

class NavigationOptions {
	constructor(direction, parentSelectionCriteria, nextIndexCriteria) {
		this.direction = direction
		this.parentSelectionCriteria = parentSelectionCriteria
		this.nextIndexCriteria = nextIndexCriteria
	}
}

const NAVIGATIONS = {
	'ArrowDown': new NavigationOptions(
		'down', (item) => item.inArray && item.last, (index) => index + 1
	),
	'ArrowUp': new NavigationOptions(
		'up', (item) => item.inArray && item.first, (index) => index - 1
	),
	'ArrowRight': new NavigationOptions(
		'right', (item) => item.inArray && item.last, (index) => index + 1
	),
	'ArrowLeft': new NavigationOptions(
		'left', (item) => item.inArray && item.first, (index) => index - 1
	)
}

function handleKeyUp(e) {
	let navigation = NAVIGATIONS[e.key]
	if (navigation) {
		let nextElement = findNextElementWithCriterias(
			Navigator.findElementByID(_selectedDom.id),
			navigation.direction,
			navigation.parentSelectionCriteria,
			navigation.nextIndexCriteria
		)
		
		if (nextElement) {
			const nextDomElement = document.getElementById(nextElement.id)
			selectElement(_selectedDom != null ? _selectedDom : null, nextDomElement)
			_selectedDom = nextDomElement
		}
		console.log(e.key,"> nextElement =", nextElement)
		console.log(e.key,"> Navigator.tree =", Navigator.tree)
	}
}

Navigator.install = function(Vue, options) {
	Vue.directive("selected", {
		bind: (element, binding, vnode) => {
			selectElement(_selectedDom != null ? _selectedDom : null, element)
			_selectedDom = element;
		},
		unbind: (element, binding, vnode) => {}
	});
	
	Vue.directive("focus", {
		// directive lifecycle
		bind: (element, binding, vnode) => {
			const that = vnode.componentInstance
			const componentParentId = that.$parent.$options.name + that.$parent._uid
			const componentNameId = that.$options.name + that._uid
			const navigate = vnode.data.directives.find(dir => dir.arg === 'navigate')
			element.id = componentNameId
			// console.log("> mounter -> element: ", componentNameId, componentParentId)
			const item = Navigator.registerFocusElement(componentParentId, componentNameId)
			item.navigate = navigate ? navigate.modifiers : {}
		},
		unbind: (element, binding, vnode) => {}
	});
};

export default Navigator
