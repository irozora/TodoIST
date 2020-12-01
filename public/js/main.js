const taskBtn = document.getElementsByClassName("task-form-btn");
const createTask = document.getElementById("create-task-btn");
const taskBox = document.getElementById("task-box");
const taskPopUp = document.getElementById("task-pop-up");

const closeForm = document.getElementsByClassName("close");

// 先按group btn來創造section後，才能夠創造task
const sectionBtn = document.getElementById("section-form-btn");
const createSection = document.getElementById("create-section-btn");
const sectionPopUp = document.getElementById("section-pop-up");

const projectContainer = document.getElementById("project-container");
const taskContainer = document.getElementsByClassName("task-container");
const dragulaTasks = dragula([ ...taskContainer ]);

// 有draggable-wrapper這個屬性的child才能被拖曳
const dragulaProject = dragula([ 
		projectContainer,
	], 
	{
		moves: (el, container, handle) => {
    	return handle.hasAttribute('section-id');
	  }
	}
);

let targetSection;

// 若originalSection等於newSection，update陣列裡只要一個object；不等於則需要兩個
let originSectionId;
let originSectionLength;
let newSectionId;
let newSectionLength;
let taskId;
let taskOriginOrder;
let taskNewOrder;

sectionBtn.addEventListener('click', showSectionForm);
createSection.addEventListener("click", addSection);
createTask.addEventListener('click', addTask);

// add event listener to close task and section form
for (let i = 0; i < closeForm.length; i ++) {
	closeForm[i].addEventListener("click", closePopUp);
}

// drag時獲取element位置
dragulaTasks.on('drag', (el, source) => {
	taskId = Number(el.id);
	taskOriginOrder = Number(getIndexInParent(el));
	originSectionId = Number(source.parentNode.getAttribute("section-id"));
	originSectionLength = source.childElementCount - 1;
});

// 單純拖曳、暫不考慮刪除task的情形
dragulaTasks.on('drop', (el, target, source, sibling) => {
	newSectionId = Number(target.parentNode.getAttribute("section-id"));
	taskNewOrder = Number(getIndexInParent(el));
	newSectionLength = Number(target.childElementCount - 1);

	let move_task = {
		id: taskId,
		task_order: taskNewOrder,
		section_id: newSectionId
	};

	let update = [];
	if (originSectionId === newSectionId) {
		let updateObj = {};
		updateObj.section_id = newSectionId;
		if (taskOriginOrder > taskNewOrder) {
			updateObj.move = 1;
			updateObj.from = taskNewOrder;
			updateObj.end = taskOriginOrder - 1;
		} else {
			// taskOriginOrder < taskNewOrder
			updateObj.move = 0
			updateObj.from = taskOriginOrder + 1;
			updateObj.end = taskNewOrder;
		}

		update.push(updateObj);
		console.log(update[0])
	} else {
		// originSectionId !== newSectionId
		let updateObj = {
			move: 0,
			section_id: originSectionId,
			from: taskOriginOrder + 1,
			end: originSectionLength
		};
		let updateObj1 = {
			move: 1,
			section_id: newSectionId,
			from: taskNewOrder,
			end: newSectionLength
		};
		update.push(updateObj, updateObj1)
	};
	
	let data = {
		move_task,
		update
	};

	// 使用者放開卡片才透過ajax與後湍連動
	fetch(`${window.location.protocol}//${window.location.hostname}:3000/api/1.0/task/updateOrder`, {
		method: 'POST',
		headers: {
    		'Content-Type': 'application/json'
	    },
		body: JSON.stringify(data)
	})
	.then(res => res.json())
	.then(result => {
		console.log(result);
	})
	.catch(error => {
		console.log(error)
	})
});

// task and block rendering
fetch(`${window.location.protocol}//${window.location.hostname}:3000/api/1.0/task/list`)
.then(res => res.json())
.then(result => {
	const { data } =  result;

	for (let i = 0; i < data.length; i++) {
		const section = document.createElement('div');
		section.classList.add('section-container');
		section.setAttribute('section-id', data[i].id)
		section.setAttribute("section-order", data[i].section_order);

		const sectionTitle = document.createElement('div');
		sectionTitle.classList.add('section-title');

		const sectionName = document.createElement('p');
		sectionName.innerHTML = data[i].name;

		const sectionCross = document.createElement('i');
		sectionCross.classList.add("fa", "fa-times");
		sectionCross.setAttribute("aria-hidden", true)
		
		sectionTitle.append(sectionName, sectionCross);

		const tContainer = document.createElement('div');
		tContainer.classList.add("task-container");
		tContainer.innerHTML = "&nbsp;"
		
		const btn = document.createElement('button');
		btn.type = "submit";
		btn.classList.add("btn", "btn-outline-warning", "task-form-btn", "btn-block");
		btn.innerHTML = "Add new task";
		btn.addEventListener("click", showTaskForm);

		if (data[i].tasks) {
			for (let j = 0; j < data[i].tasks.length; j ++) {
				let currentTask = data[i].tasks[j];

				const task = document.createElement('div');
				task.classList.add('task-block');
				task.id = currentTask.task_id;

				const taskName = document.createElement('p');
				taskName.classList.add('name');
				taskName.innerText = currentTask.name;

				const taskDescription = document.createElement('p');
				taskDescription.classList.add('description');
				taskDescription.innerText = currentTask.description;

				task.append(taskName, taskDescription);
				tContainer.appendChild(task);
			}
		}

		section.append(sectionTitle, tContainer, btn);
		projectContainer.appendChild(section);
		dragulaTasks.containers.push(tContainer);
	}
})
.catch(error => {
	console.log(error)
})

// acquire element location
function getIndexInParent (el) {
  return Array.from(el.parentNode.children).indexOf(el)
}

// async function use to create section
async function addSection(e) {
	e.preventDefault();

    let name = document.getElementById("section-name");
	const section = document.createElement('div');
	section.classList.add('section-container');

	const sectionTitle = document.createElement('div');
	sectionTitle.classList.add('section-title');

	const sectionName = document.createElement('p');
	sectionName.innerHTML = name.value;

	const sectionCross = document.createElement('i');
	sectionCross.classList.add("fa", "fa-times");
	sectionCross.setAttribute("aria-hidden", true)
	
	sectionTitle.append(sectionName, sectionCross);

	const tContainer = document.createElement('div');
	tContainer.classList.add("task-container");
	tContainer.innerHTML = "&nbsp;"
	
	const btn = document.createElement('button');
	btn.type = "submit";
	btn.classList.add("btn", "btn-outline-warning", "task-form-btn", "btn-block");
	btn.innerHTML = "Add new task";
	btn.addEventListener("click", showTaskForm);
	section.append(sectionTitle, tContainer, btn);
	
	projectContainer.appendChild(section);
	let section_order;
	for (let i = 0; i < projectContainer.childElementCount; i++) {
		section_order = i;
		section.setAttribute("section-order", section_order);
	}

	const sectionInfo = {
		name: name.value,
		section_order: section_order
	}

	const sectionId = await getSectionId(sectionInfo);
	console.log(sectionId);
	section.setAttribute("section-id", sectionId);

	dragulaTasks.containers.push(tContainer);
	sectionPopUp.style.display = "none";

	name.value = '';
}

// async function use to create task
async function addTask (e) {
	e.preventDefault();
	console.log(e.target)
    const name = document.getElementById("task-name");
    const description = document.getElementById("task-description");

	const task = document.createElement('div');
	task.classList.add('task-block');

	const taskName = document.createElement('p');
	taskName.classList.add('name');
	taskName.innerText = name.value;

	const taskDescription = document.createElement('p');
	taskDescription.classList.add('description');
	taskDescription.innerText = description.value;

	task.append(taskName, taskDescription);

	const targetTaskContainer = targetSection.firstElementChild.nextElementSibling;
	console.log(targetTaskContainer);
	targetTaskContainer.appendChild(task);

    taskPopUp.style.display = "none";

	const taskInfo = {};
	taskInfo.name = name.value;
	taskInfo.description = description.value;
	for (let i = 0; i < targetTaskContainer.childElementCount; i++) {
		taskInfo.task_order = targetTaskContainer.childElementCount - 1;
	}

	// section_id以draggable-wrapper的數字(section在db中的id)為準
	taskInfo.section_id = Number(targetTaskContainer.parentNode.getAttribute("section-id"));

	task.id = await getTaskId(taskInfo);
	console.log(task.id)

	name.value = '';
	description.value = '';
}

// Get section id after insert into db
function getSectionId (sectionInfo) {
	let id = fetch(`${window.location.protocol}//${window.location.hostname}:3000/api/1.0/section/create`, {
		method: 'POST',
		headers: {
    		'Content-Type': 'application/json'
	    },
		body: JSON.stringify(sectionInfo)
	})
	.then(res => res.json())
	.then(result => {
		return result.insertId;
	})
	.catch(error => {
		console.log(error)
	})

	return id;
}

// Get task id after insert into db
function getTaskId (taskInfo) {
	let id = fetch(`${window.location.protocol}//${window.location.hostname}:3000/api/1.0/task/create`, {
		method: 'POST',
		headers: {
    		'Content-Type': 'application/json'
	    },
		body: JSON.stringify(taskInfo)
	})
	.then(res => res.json())
	.then(result => {
		return result.insertId;
	})
	.catch(error => {
		console.log(error)
	})

	return id;
}

// function add on block buttons to show task form
function showTaskForm(e) {
	if (e.target.classList.contains('task-form-btn')) {
		taskPopUp.style.display = "block";
		targetSection = e.target.parentNode;
	}
}

// function to show section form
function showSectionForm() {
	sectionPopUp.style.display = "block";
}

function closePopUp(e) {
	let target = e.target.parentNode.parentNode.parentNode;
	if (target === sectionPopUp || target === taskPopUp) {
		target.style.display = "none";
	}
}
