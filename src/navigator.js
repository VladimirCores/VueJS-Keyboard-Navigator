let _selectedDom;

function findElement(name, currentNode, level = 0) {
	// console.log('findNode > name =', name, currentNode)
	if (!currentNode || level >= 10) {
		return null;
	} else if (currentNode[name]) return currentNode[name];
	else {
		for (const key in currentNode) {
			// console.log('findNode > key = ', key)
			if (key === name) return currentNode[key];
			const res = findElement(name, currentNode[key], level + 1);
			if (res) return res;
		}
		return null;
	}
}

class Element
{
	constructor(name, parent, numChildren, index) {
		this.name = name
		this.parent = parent
		this.numChildren = numChildren
		this.index = index
		this.inArray = false
		this.first = false
		this.last = false
	}
}

class Navigator {
	static tree = {};
	static init() {
		window.removeEventListener("keyup", handleKeyUp);
		window.addEventListener("keyup", handleKeyUp);
		Navigator.tree = {};
	}
	
	static findNodeForID(id) {
		return findElement(id, Navigator.tree);
	}
	
	static getPrevElement(element, loop) {
		const parentElement = findElement(element.parent, Navigator.tree)
		if (parentElement) {
			const children = parentElement.children
			const prevElementIndex = element.index - 1
			console.log('> \t\tgetPrevElement > ', prevElementIndex, children.length, parentElement)
			if (prevElementIndex > -1) {
				return parentElement[children[prevElementIndex]]
			} else if (loop) {
				return parentElement[children[children.length - 1]]
			}
		}
		else null
	}
	
	static getNextElement(element, loop) {
		const parentElement = findElement(element.parent, Navigator.tree)
		const children = parentElement.children
		let nextElementIndex = loop ? 0 : element.index + 1
		let result = null
		console.log('> \t\tgetNextElement > :', nextElementIndex, children.length)
		
		if (nextElementIndex < parentElement.numChildren || loop)
			result = parentElement[children[nextElementIndex]]
		
		parentElement.selectedIndex = nextElementIndex
		return result
	}
	
	static registerFocusElement(parent, child) {
		if (parent) {
			let parentElement = findElement(parent, Navigator.tree)
			let childElement
			if (parentElement) {
				childElement = findElement(child, Navigator.tree)
				if (childElement) {
					if (Navigator.tree[child]) delete Navigator.tree[child]
					childElement.parent = parent
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
					childElement.parent = parent
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
				parentElement.name = parent
				parentElement.selectedIndex = 0
				// console.log("\t\tno parent: " + parent, child, parentNode)
			}
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

function findNextElement (node, index, reverse, loop) {
	let nextParentElement = reverse ? Navigator.getPrevElement(node, !!loop) : Navigator.getNextElement(node, !!loop)
	while (nextParentElement && nextParentElement.numChildren > 0) {
		console.log('> \t\tfindNextElement:', nextParentElement.name, nextParentElement.parent, index, nextParentElement.selectedIndex)
		if (!isNaN(index) && index < nextParentElement.numChildren) {
			nextParentElement.selectedIndex = index
		} else {
			nextParentElement.selectedIndex = nextParentElement.numChildren - 1
		}
		nextParentElement = nextParentElement[nextParentElement.children[nextParentElement.selectedIndex]]
	}
	return nextParentElement
}

function lookUpForParentNavigation(parent, iteration = 0) {
	let parentElement = findElement(parent, Navigator.tree)
	console.log(`> \tlookUpForParentNavigation -> parent =`, parent, iteration, parentElement)
	if (parentElement
		&& ((parentElement.navigate && !parentElement.navigate.up)
			|| parentElement.inArray && parentElement.first)
		) // Go to the next level up
		return lookUpForParentNavigation(parentElement.parent, ++iteration)
	// console.log(`> \tlookUpForParentNavigation -> parentElement.name =`, parentElement.name, parentElement.navigate)
	return { parentElement, iteration }
}

function lookDownForChildrenNavigation(parentElement) {
	console.log(`> \t\tlookDownForChildrenNavigation -> parentElement =`, parentElement)
	let child = parentElement
	if (parentElement && parentElement.numChildren > 0) {
		child = lookDownForChildrenNavigation(parentElement[parentElement.children[parentElement.selectedIndex]])
	}
	return child
}

function lookRightForParentNavigation(parent) {
	let parentElement = findElement(parent, Navigator.tree)
	console.log(`> \tlookRightForParentNavigation -> parent =`, parent, parentElement)
	if (parentElement && parentElement.navigate && !parentElement.navigate.right) // Go to the next level up
		return lookRightForParentNavigation(parentElement.parent)
	return parentElement.parent ? parentElement : null
}

function lookLeftForParentNavigation(parent) {
	const parentElement = findElement(parent, Navigator.tree)
	console.log(`> \tlookLeftForParentNavigation -> parent =`, parent, parentElement.navigate)
	if (parentElement && parentElement.navigate && !parentElement.navigate.left) // Go to the next level up
		return lookLeftForParentNavigation(parentElement.parent)
	return parentElement.parent ? parentElement : null // filter root
}

function handleKeyUp(e) {
	const selectedElement = Navigator.findNodeForID(_selectedDom.id)
	const selectedElementIndex = selectedElement.index
	const allowedNavigation = selectedElement.navigate
	let nextElement = null
	console.log(`> ${e.key}: selectedNode.navigate =`, allowedNavigation)
	if (e.key === 'ArrowDown') {
		if (allowedNavigation.down) {
			nextElement = lookDownForChildrenNavigation(findNextElement(selectedElement, selectedElementIndex))
		}
		if (!nextElement)	{
			let parent = selectedElement;
			do {
				parent = findElement(parent.parent, Navigator.tree)
				console.log(`> \t\tparent =`, parent)
			} while(parent
				&& ((parent.navigate && !parent.navigate.down)
					|| parent.inArray && parent.last))
					if (parent && parent.parent)
						nextElement = findNextElement(parent, 0)
		}
	}
	else if (e.key === 'ArrowUp') {
		if (allowedNavigation.up) {
			nextElement = findNextElement(selectedElement, selectedElementIndex, true)
			console.log('> \t\t nextElement up:', nextElement)
		}
		if (!nextElement) {
			const parent = lookUpForParentNavigation(selectedElement.parent).parentElement
			if (parent) nextElement = findNextElement(parent, selectedElementIndex, true)
			console.log('> \t\t nextElement parent:', nextElement)
		}
	}
	else if (e.key === 'ArrowRight') {
		if (selectedElement.navigate.right) {
			nextElement = findNextElement(selectedElement, 0, false, selectedElement.navigate.loop)
		}
		if (!nextElement) {
			const parent = lookRightForParentNavigation(selectedElement.parent)
			if (parent) nextElement = findNextElement(parent, 0, false)
		}
	}
	else if (e.key === 'ArrowLeft') {
		if (selectedElement.navigate.left) {
			nextElement = findNextElement(selectedElement, 0, true, selectedElement.navigate.loop)
		}
		if (!nextElement) {
			const parent = lookLeftForParentNavigation(selectedElement.parent)
			if (parent) nextElement = findNextElement(parent, 0, true)
		}
	}
	
	console.log("Process event: \n\t _selectedDom.id =", _selectedDom.id)
	console.log("\t selectedElement name|parent:", selectedElement.name, selectedElement.parent, allowedNavigation)
	console.log("\t nextElement:", nextElement)
	console.log("\t Navigator.tree =", Navigator.tree)
	
	if (nextElement) {
		const nextDomElement = document.getElementById(nextElement.name)
		selectElement(_selectedDom != null ? _selectedDom : null, nextDomElement)
		_selectedDom = nextDomElement
	}
}

Navigator.install = function(Vue, options) {
	Vue.directive("selected", {
		bind: (element, binding, vnode) => {
			console.log(element);
			selectElement(_selectedDom != null ? _selectedDom : null, element)
			_selectedDom = element;
			// console.log('selected', vnode.data.directives.find(movie => movie.arg === 'navigate'))
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
