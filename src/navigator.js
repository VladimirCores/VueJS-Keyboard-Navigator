let _selectedVNode;
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
		const children = parentElement.children
		const prevElementIndex = element.index - 1
		console.log('> \t\tgetPrevElement > ', prevElementIndex, children.length, parentElement)
		if (prevElementIndex > -1) {
			return parentElement[children[prevElementIndex]]
		} else if (loop) {
			return parentElement[children[children.length - 1]]
		}
		else null
	}
	
	static getNextElement(element, loop) {
		const parentElement = findElement(element.parent, Navigator.tree)
		const children = parentElement.children
		const nextElementIndex = element.index + 1
		console.log('> \t\tgetNextElement > :', nextElementIndex, children.length)
		if (nextElementIndex < parentElement.numChildren) {
			return parentElement[children[nextElementIndex]]
		} else if (loop) {
			return parentElement[children[0]]
		}
		else null
	}
	
	static registerFocusElement(parent, child) {
		if (parent) {
			let parentNode = findElement(parent, Navigator.tree)
			let childNode
			if (parentNode) {
				childNode = findElement(child, Navigator.tree)
				if (childNode) {
					if (Navigator.tree[child]) delete Navigator.tree[child]
					childNode.parent = parent
					parentNode[child] = childNode
				} else {
					childNode = parentNode[child] = { name: child, parent: parent, numChildren: 0, index: parentNode.numChildren || 0 }
				}
				parentNode.numChildren = parentNode.numChildren ? parentNode.numChildren + 1 : 1
				if (!parentNode.children) parentNode.children = []
				childNode.index = parentNode.children.length
				parentNode.children.push(child)
			} else {
				parentNode = Navigator.tree[parent] || (Navigator.tree[parent] = {})
				parentNode[child] = childNode = { name: child, parent: parent, numChildren: 0, index: 0 }
				parentNode.numChildren = 1
				parentNode.children = [child]
				parentNode.name = parent
			}
			return childNode
		} else if (!Navigator.tree[child]) {
			Navigator.tree[child] = { name: child, parent: 'root', numChildren: 0, index: 0 }
			return Navigator.tree[child]
		}
	}
}

function selectElement(prev, next) {
	if (prev != null) prev.classList.remove("selected")
	next.classList.add("selected")
}

function findNextElement (node, index, reverse) {
	let nextElement = reverse ? Navigator.getPrevElement(node) : Navigator.getNextElement(node)
	if (nextElement && nextElement.numChildren > 0) {
		const nextIndex = !isNaN(index) && index < nextElement.numChildren ? index : nextElement.numChildren - 1
		nextElement = nextElement[nextElement.children[nextIndex]]
	}
	return nextElement
}

function handleKeyUp(e) {
	const selectedNode = Navigator.findNodeForID(_selectedDom.id)
	const selectedNodeIndex = selectedNode.index
	const allowedNavigation = selectedNode.navigate
	let nextElement
	console.log(`> ${e.key}: selectedNode.navigate =`, selectedNode.navigate)
	if (e.key === 'ArrowDown') {
		if (allowedNavigation.down) nextElement = findNextElement(selectedNode, selectedNodeIndex)
		else { // If navigate down from child element than does not have navigation - choose parent
			const parent = findElement(selectedNode.parent, Navigator.tree)
			console.log(`> \t: parent =`, parent)
			if (parent && parent.navigate && parent.navigate.down) nextElement = findNextElement(parent, selectedNodeIndex)
		}
	}
	else if (e.key === 'ArrowUp') {
		if (allowedNavigation.up) nextElement = findNextElement(selectedNode, selectedNodeIndex, true)
		else { // If navigate down from child element than does not have navigation - choose parent
			const parent = findElement(selectedNode.parent, Navigator.tree)
			if (parent && parent.navigate && parent.navigate.up) nextElement = findNextElement(parent, selectedNodeIndex, true)
		}
	}
	else if (e.key === 'ArrowRight') {
		if (selectedNode.navigate.right) {
			if (selectedNode.navigate.loop)
				nextElement = Navigator.getNextElement(selectedNode, selectedNode.navigate.loop)
			else nextElement = findNextElement(selectedNode, 0)
			console.log('> \t nextElement', nextElement)
			// if (nextElement == null) {
			// 	const parent = findElement(selectedNode.parent, Navigator.tree)
			// 	nextElement = findNextElement(parent)
			// }
		}
		//TODO: NAVIGATE RIGHT FROM PARENT
	}
	else if (e.key === 'ArrowLeft') {
		if (selectedNode.navigate.left) {
			nextElement = Navigator.getPrevElement(selectedNode, selectedNode.navigate.loop)
			console.log('> \t nextElement', nextElement)
			if (!nextElement) {
				const parent = findElement(selectedNode.parent, Navigator.tree)
				nextElement = findNextElement(parent, 0, true)
			}
		}
		//TODO: NAVIGATE LEFT FROM PARENT
	}
	
	if (nextElement) {
		const nextDomElement = document.getElementById(nextElement.name)
		selectElement(_selectedDom != null ? _selectedDom : null, nextDomElement)
		_selectedDom = nextDomElement
	}
	
	console.log("Process event: ", _selectedDom.id, selectedNode, Navigator.tree)
}

Navigator.install = function(Vue, options) {
	Vue.directive("selected", {
		bind: (element, binding, vnode) => {
			console.log(element);
			selectElement(_selectedDom != null ? _selectedDom : null, element)
			_selectedDom = element;
			_selectedVNode = vnode;
			// console.log("selected", _selectedVNode, Navigator.tree);
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
