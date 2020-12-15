// const projectIdQuery = window.location.search;
// let projectId = new URLSearchParams(projectIdQuery).get('id');
// projectId = Number(projectId);
// const accessToken = localStorage.getItem('Authorization');
// const headers = {
// 	'Content-Type': 'application/json',
// 	'Authorization': accessToken
// };
// if (!accessToken) {
//     window.location = `/home.html`;
// }

if (!projectId) {
    window.location = `/404.html`;
} else {
	getProjectInfo();
	getSectionsAndTasks();
}

const socket = io();

const taskBtn = document.getElementsByClassName("task-form-btn");
const createTask = document.getElementById("create-task-btn");
const taskBox = document.getElementById("task-box");
const taskPopUp = document.getElementById("task-pop-up");
const currentTaskDetailPopUp = document.getElementById("current-task-detail-pop-up");

// 先按group btn來創造section後，才能夠創造task
const sectionBtn = document.getElementById("section-form-btn");
const createSection = document.getElementById("create-section-btn");
const sectionPopUp = document.getElementById("section-pop-up");

const closeForm = document.getElementsByClassName("close");

const projectContainer = document.getElementById("project-container");
const taskContainer = document.getElementsByClassName("task-container");

const datePickerField = document.getElementById('datepicker');

const dragulaTasks = dragula([ 
		...taskContainer 
	], 
	{
		moves: (el, container, handle) => {
    		return handle.classList.contains('fa-arrows-task');
		}
});

// 有fa-arrows-alt這個class的child的parent才能被拖曳
const dragulaProject = dragula([ 
		projectContainer
	], 
	{
		moves: (el, container, handle) => {
    		return handle.classList.contains('fa-arrows-section');
		}
	}
);

let targetSection;

// 若originalSection等於newSection，update陣列裡只要一個object；不等於則需要兩個
let originSectionId;
let originSection;
let originSectionLength;
let newSectionId;
let newSection;
let newSectionLength;
let taskId;
let taskOriginOrder;
let taskNewOrder;

// Variables to change order of section
let sectionId;
let sectionOriginOrder;
let sectionNewOrder;

sectionBtn.addEventListener('click', showSectionForm);
createSection.addEventListener("click", addSection);
createTask.addEventListener('click', addTask);

// add event listener to close task and section form
for (let i = 0; i < closeForm.length; i ++) {
	closeForm[i].addEventListener("click", closePopUp);
}

// 調整task位置的drag and drop event
dragulaTasks.on('drag', (el, source) => {
	taskId = Number(el.id);
	taskOriginOrder = Number(el.getAttribute("task-order"));
	originSectionId = Number(source.parentNode.getAttribute("section-id"));
	originSection = source.parentNode;
	originSectionLength = source.childElementCount - 1;
});

dragulaTasks.on('drop', (el, target, source, sibling) => {
	newSectionId = Number(target.parentNode.getAttribute("section-id"));
	newSection = target.parentNode;
	taskNewOrder = Number(getIndexInParent(el));
	newSectionLength = Number(target.childElementCount - 1);

	let move_task = {
		id: taskId,
		task_order: taskNewOrder,
		section_id: newSectionId
	};

	el.removeAttribute("task-order");
	el.setAttribute("task-order", taskNewOrder);

	let update = [];
	if (originSectionId === newSectionId) {
		let updateObj = {};
		updateObj.section_id = newSectionId;
		if (taskOriginOrder > taskNewOrder) {
			updateObj.move = 1;
			updateObj.from = taskNewOrder;
			updateObj.end = taskOriginOrder - 1;

			for (let i = taskNewOrder + 1; i <= taskOriginOrder ; i++) {
				let task = originSection.children[1].children[i];
				task.removeAttribute("task-order");
				task.setAttribute("task-order", i);
			}
		} else {
			// taskOriginOrder < taskNewOrder
			updateObj.move = 0
			updateObj.from = taskOriginOrder + 1;
			updateObj.end = taskNewOrder;

			for (let i = taskOriginOrder; i <= taskNewOrder ; i++) {
				let task = originSection.children[1].children[i];
				task.removeAttribute("task-order");
				task.setAttribute("task-order", i);
			}
		}

		update.push(updateObj);
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

		for (let i = taskNewOrder + 1; i < newSection.children[1].children.length ; i++) {
			let task = newSection.children[1].children[i];
			task.removeAttribute("task-order");
			task.setAttribute("task-order", i);
		}

		for (let i = taskOriginOrder; i <= originSection.children[1].children.length ; i++) {
			let task = originSection.children[1].children[i];
			if (task) {
				task.removeAttribute("task-order");
				task.setAttribute("task-order", i);
			}
		}

		update.push(updateObj, updateObj1)
	};
	
	let data = {
		move_task,
		update
	};

	// 使用者放開卡片才透過ajax與後湍連動
	updateOrder("task", data)
});
 
// 調整section位置的drag and drop event
dragulaProject.on('drag', (el, source) => {
	sectionId = Number(el.getAttribute("section-id"));
	sectionOriginOrder = Number(getIndexInParent(el));
});

dragulaProject.on('drop', (el, target, source, sibling) => {
	sectionNewOrder = Number(getIndexInParent(el));
	const pContainer = el.parentNode;
	let move_section = {
		id: sectionId,
		section_order: sectionNewOrder
	};

	el.removeAttribute("section-order");
	el.setAttribute("section-order", sectionNewOrder);

	let update = {
		project_id: projectId
	};
	if (sectionOriginOrder > sectionNewOrder) {
		update.move = 1;
		update.from = sectionNewOrder;
		update.end = sectionOriginOrder - 1;

		for (let i = sectionNewOrder + 1; i <= sectionOriginOrder ; i++) {
			let section = pContainer.children[i];
			section.removeAttribute("section-order");
			section.setAttribute("section-order", i);
		}
	};
	if (sectionOriginOrder < sectionNewOrder) {
		update.move = 0;
		update.from = sectionOriginOrder + 1;
		update.end = sectionNewOrder;

		for (let i = sectionOriginOrder; i <= sectionNewOrder ; i++) {
			let section = pContainer.children[i];
			section.removeAttribute("section-order");
			section.setAttribute("section-order", i);
		}
	};

	let data = {
		move_section,
		update
	};

	updateOrder("section",data);
});

// project name rendering
function getProjectInfo() {
	fetch(`/api/1.0/project/${projectId}`)
	.then(res => res.json())
	.then(result => {
		const projectTitle = document.getElementById('title-section').firstElementChild;
		projectTitle.innerHTML = result.data[0].name;
		const projectTitleInDetail = document.getElementById('task-belong-project-name').firstElementChild;
		projectTitleInDetail.innerHTML = result.data[0].name;
	})
	.catch(error => {
		console.log(error);
	})
}

// task and section rendering
function getSectionsAndTasks() {
	fetch(`/api/1.0/task/list?id=${projectId}`)
	.then(res => res.json())
	.then(result => {
		const { data } =  result;

		for (let i = 0; i < data.length; i++) {
			let tContainer = createSectionElement(data[i].name, data[i].section_order, data[i].id);

			if (data[i].tasks) {
				for (let j = 0; j < data[i].tasks.length; j ++) {
					let currentTask = data[i].tasks[j];

					const newTask = createTaskElement(currentTask.name, currentTask.task_order, currentTask.task_id, currentTask.isComplete);

					tContainer.appendChild(newTask);
				}
			}
		}
	})
	.catch(error => {
		console.log(error)
	})
}

// acquire element location
function getIndexInParent (el) {
  return Array.from(el.parentNode.children).indexOf(el)
}

// function to check or uncheck task completion checkbox
function checkingTask (isComplete, taskCheckbox, taskNameSpan) {
	switch (isComplete) {
		case 1: 
			taskCheckbox.checked = true;
			taskNameSpan.classList.add('cross-out');
			break;
		case 0: 
			taskCheckbox.checked = false;
			taskNameSpan.classList.remove('cross-out');
			break;
	}
}

// function to close the 3 pop up forms
function closePopUp(e) {
	let target = e.target.parentNode.parentNode.parentNode;

	if (target === sectionPopUp) {
		target.style.display = "none";
	    let name = document.getElementById("section-name");
		name.value = "";
	}
	if (target === taskPopUp) {
		target.style.display = "none";
		let name = document.getElementById("task-name");
	    let description = document.getElementById("task-description");
	    let datepicker = document.getElementById("datepicker");
		name.value = "";
		description.value = "";
		datepicker.value = "";
	}
	if (target.parentNode === currentTaskDetailPopUp) {
		target.parentNode.style.display = "none";
		
		// 使用者按了編輯task name後沒有save也沒有cancel就把視窗關掉的情形
		const nameSpan = document.getElementsByClassName('current-task-name')[0]
		const nameTitle = nameSpan.parentNode;
		const nameForm = nameSpan.nextElementSibling;
		if (nameSpan.style.display === 'none' ) {
			nameTitle.removeChild(nameForm)
			nameSpan.style.display = 'block';
		}

		// 使用者按了編輯schedule後沒有save也沒有cancel就把視窗關掉的情形
		const dateSpan = document.getElementsByClassName('current-due-date')[0]
		const dateTitle = dateSpan.parentNode;
		const dateForm = dateSpan.nextElementSibling;
		if (dateSpan.style.display === 'none' ) {
			dateTitle.removeChild(dateForm)
			dateSpan.style.display = 'block';
		}

		// 使用者按了編輯description後沒有save也沒有cancel就把視窗關掉的情形
		const descriptionSpan = document.getElementsByClassName('current-task-description')[0]
		const descriptionTitle = descriptionSpan.parentNode;
		const descriptionForm = descriptionSpan.nextElementSibling;
		if (descriptionSpan.style.display === 'none' ) {
			descriptionTitle.removeChild(descriptionForm)
			descriptionSpan.style.display = 'block';
		}

	}
}

// async function use to create section
async function addSection(e) {
	e.preventDefault();

    let name = document.getElementById("section-name");
	let sectionName = name.value;

	name.value = '';

	if (!sectionName.trim()) {
		swal(`Section name is required!`);
		return;
	}

	if (sectionName.trim().length > 15) {
		swal(`Section name should be less than 15 characters.`);
		return;
	}

	let section_order;
	for (let i = 0; i <= projectContainer.childElementCount; i++) {
		section_order = projectContainer.childElementCount;
	}

	const sectionInfo = {
		name: sectionName,
		section_order: section_order,
		project_id: projectId
	}

	// const sectionId = await getSectionId(sectionInfo);
	const sectionId = await getInsertedDataId('section', sectionInfo);

	createSectionElement(sectionName, section_order, sectionId);

	sectionPopUp.style.display = "none";
}

// async function use to create task
async function addTask (e) {
	e.preventDefault();

	const name = document.getElementById("task-name");
    const description = document.getElementById("task-description");
	const dueDate = datePickerField;
	const taskNameValue = name.value.trim();
	const taskDescriptionValue = description.value.trim();
	const taskDueDateValue = dueDate.value.trim();

	name.value = '';
	description.value = '';
	dueDate.value = '';

	if (!taskNameValue) {
		swal(`Task name cannot be empty!`);
		return;
	}

	if (taskNameValue.length > 15) {
		swal(`Task name should be less than 15 characters.`);
		return;
	}

    taskPopUp.style.display = "none";

	const taskInfo = {
		name: taskNameValue
	};

	if (taskDescriptionValue.length > 150) {
		swal(`Task description should remain less than 150 characters.`);
		return;
	}

	if (taskDescriptionValue) {
		taskInfo.description = taskDescriptionValue;
	}

	if (taskDueDateValue) {
		taskInfo.dueDate = taskDueDateValue;
	}

	const targetTaskContainer = targetSection.firstElementChild.nextElementSibling;
	for (let i = 0; i <= targetTaskContainer.childElementCount; i++) {
		taskInfo.task_order = targetTaskContainer.childElementCount;
	}

	// section_id以section-id的數字(section在db中的id)為準
	taskInfo.section_id = Number(targetTaskContainer.parentNode.getAttribute("section-id"));

	const taskId = await getInsertedDataId('task', taskInfo);

	let newTaskCompletion = 0; // 0 means incomplete
	const newTask = createTaskElement(taskNameValue, taskInfo.task_order, taskId, newTaskCompletion);

	targetTaskContainer.appendChild(newTask);
}

// get id for section or task after insert into db
function getInsertedDataId (type, data) {
	let id = fetch(`/api/1.0/${type}/create`, {
		method: 'POST',
		headers: headers,
		body: JSON.stringify(data)
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

// function to show section form
function showSectionForm() {
	sectionPopUp.style.display = "block";
}

// function add on block buttons to show task form
function showTaskForm(e) {
	if (e.target.classList.contains('task-form-btn')) {
		taskPopUp.style.display = "block";
		targetSection = e.target.parentNode;
	}
}

// show all tasks
function showTaskContainer(e) {
	let dropdownIcon = e.target;
	if (dropdownIcon.classList.contains('fa-caret-down')) {
		let tasks = e.target.parentNode.parentNode.nextElementSibling;
		if (tasks.style.display === "block") {
			dropdownIcon.style.transform = "rotate(270deg)";
			tasks.style.display = "none"
		} else {
			dropdownIcon.style.transform = "rotate(360deg)";
			tasks.style.display = "block"
		}
	}
}

// function to replace section title span with form(with input and buttons)
function showEditSectionForm(e) {
	const sectionSpan = e.target;
	if (sectionSpan.classList.contains('section-name')) {
		let name = sectionSpan.innerHTML;
		sectionSpan.style.display = 'none';
		
		const form = document.createElement('form');
		form.classList.add("section-title-form");
		const input = document.createElement('input');
		input.classList.add("rename-section-input")
		input.type = "text";
		input.value = name;
		const saveBtn = document.createElement('button');
		saveBtn.classList.add("rename-section-btn", "btn");
		saveBtn.type = "submit";
		saveBtn.innerHTML = "Save";
		saveBtn.addEventListener("click", saveSectionEdit);

		const cancelBtn = document.createElement('button');
		cancelBtn.classList.add("cancel-section-rename-btn", "btn");
		cancelBtn.type = "submit";
		cancelBtn.innerHTML = "Cancel";
		cancelBtn.addEventListener("click", cancelSectionEdit);

		form.append(input, saveBtn, cancelBtn);
		sectionSpan.parentNode.append(form);
	}
}

// 要建立一個section，必須要有名稱、順序與id
function createSectionElement(sectionName, sectionOrder, sectionId) {
	// sectionContainer中有三個main element，section-header、task-container，與add task btn
	const sectionContainer = document.createElement('div');
	sectionContainer.classList.add('section-container');
	sectionContainer.setAttribute("section-order", sectionOrder);
	sectionContainer.setAttribute("section-id", sectionId);

	// section-header
	const sectionHeader = document.createElement('div');
	sectionHeader.classList.add('section-header', "section-header-bar");

	const sectionHandleBar = document.createElement('div');
	sectionHandleBar.classList.add('section-handle-bar');

	const handlerIcon = document.createElement('i');
	handlerIcon.classList.add("fa", "fa-arrows-alt", "fa-sm", "fa-arrows-section");
	handlerIcon.setAttribute("aria-hidden", true);

	const dropdownIcon = document.createElement('i');
	dropdownIcon.classList.add("fa", "fa-caret-down", "fa-lg");
	dropdownIcon.setAttribute("aria-hidden", true);
	// event for dropping down task container
	dropdownIcon.addEventListener('click', showTaskContainer);

	sectionHandleBar.append(handlerIcon, dropdownIcon);

	const sectionTitle = document.createElement('div');
	sectionTitle.classList.add('section-title');

	const sectionTitleSpan = document.createElement('span');
	sectionTitleSpan.classList.add('section-name');
	sectionTitleSpan.setAttribute("section-id", sectionId);
	sectionTitleSpan.addEventListener('click', showEditSectionForm);
	sectionTitleSpan.innerHTML = sectionName;

	sectionTitle.append(sectionTitleSpan);

	const sectionRemove = document.createElement('div');
	sectionRemove.classList.add('section-remove');

	const removeIcon = document.createElement('i');
	removeIcon.classList.add("fa", "fa-trash", "fa-lg", "remove-section-icon");
	removeIcon.setAttribute("aria-hidden", true);
	removeIcon.addEventListener("click", removeSection);
	sectionRemove.append(removeIcon);

	sectionHeader.append(sectionHandleBar, sectionTitle, sectionRemove);
	
	// task-container
	const tContainer = document.createElement('div');
	tContainer.classList.add("task-container");
	tContainer.innerHTML = "&nbsp;"

	// add task btn
	const btn = document.createElement('button');
	btn.type = "submit";
	btn.classList.add("btn", "task-form-btn", "btn-block");
	btn.innerHTML = "+ Add task";
	// event to show task form
	btn.addEventListener("click", showTaskForm);

	dragulaTasks.containers.push(tContainer);
	sectionContainer.append(sectionHeader, tContainer, btn)
	projectContainer.appendChild(sectionContainer);

	return tContainer;
}

// 要建立一個task，必須要有名稱與id
function createTaskElement(taskName, taskOrder, taskId, isComplete) {
	const task = document.createElement('div');
	task.classList.add('task-block');

	const taskHandleBar = document.createElement('div');
	taskHandleBar.classList.add('task-handle-bar');
	const handlerIcon = document.createElement('i');
	handlerIcon.classList.add("fa", "fa-arrows-alt", "fa-sm", "fa-arrows-task");
	handlerIcon.setAttribute("aria-hidden", true);

	const checkboxLabel = document.createElement('label');
	checkboxLabel.classList.add('checkbox-label');
	const checkbox = document.createElement('input');
	checkbox.type = "checkbox";
	
	checkbox.addEventListener('click' ,completeTask);

	const customCheckBox = document.createElement('span');
	customCheckBox.classList.add('checkMark');

	checkboxLabel.append(checkbox, customCheckBox)

	checkbox.classList.add("isComplete");
	// taskHandleBar.append(handlerIcon, checkbox);
	taskHandleBar.append(handlerIcon, checkboxLabel);

	const taskHeader = document.createElement('div');
	taskHeader.classList.add('task-header');
	taskHeader.setAttribute("task-id", taskId);
	const name = document.createElement('p');
	name.classList.add('name');
	name.setAttribute("task-id", taskId);
	name.innerText = taskName;

	checkingTask(isComplete, checkbox, name);

	taskHeader.addEventListener("click", showTaskDetailForm);
	taskHeader.append(name);

	const taskRemove = document.createElement('div');
	taskRemove.classList.add('task-remove');
	const removeIcon = document.createElement('i');
	removeIcon.classList.add("fa", "fa-trash", "fa-lg", "remove-task-icon");
	removeIcon.addEventListener("click", removeTask);
	removeIcon.setAttribute("aria-hidden", true);
	removeIcon.addEventListener("click", removeSection);
	taskRemove.append(removeIcon);

	task.append(taskHandleBar, taskHeader, taskRemove)

	task.setAttribute("task-order", taskOrder)
	task.id = taskId
	return task;
}

// edit data section or task table using id
function editDataById (type, id, data) {
	fetch(`/api/1.0/${type}/${id}`, {
		method: 'POST',
		headers: headers,
		body: JSON.stringify(data)
	})
	.then(res => res.json())
	.then(result => {
		console.log(result);
	})
	.catch(error => {
		console.log(error)
	})
}

// save section edit
function saveSectionEdit(e) {
	e.preventDefault();
	const sectionTitle = e.target.parentNode.parentNode;
	const form = e.target.parentNode;
	const inputBox = e.target.previousSibling;
	let inputValue = inputBox.value;
	inputValue = inputValue.trim();
	const titleSpan = e.target.parentNode.previousSibling;
	const sectionId = Number(titleSpan.getAttribute("section-id"));

	if (!inputValue) {
		swal(`Section name cannot be empty!`);
		return;
	}

	sectionTitle.removeChild(form);
	titleSpan.innerHTML = inputValue;
	titleSpan.style.display = "block";
	const data = {
		name: inputValue
	};

	editDataById('section', sectionId, data);
}

// cancel section edit
function cancelSectionEdit(e) {
	e.preventDefault();
	const form = e.target.parentNode;
	const sectionTitle = e.target.parentNode.parentNode;
	const titleSpan = e.target.parentNode.previousElementSibling;
	titleSpan.style.display = "block";
	sectionTitle.removeChild(form);
}

// delete section and alter section order of remaining sections
function removeSection(e) {
	const removeBtn = e.target;
	if (removeBtn.classList.contains("remove-section-icon")) {
		const targetSection = removeBtn.parentNode.parentNode.parentNode;
		const projectContainer = targetSection.parentNode;
		sectionId = Number(targetSection.getAttribute("section-id"));
		sectionOriginOrder = Number(targetSection.getAttribute("section-order"));

		const fromSectionOrder = sectionOriginOrder + 1;
		const endSectionOrder = Number(projectContainer.lastChild.getAttribute("section-order"));

		const delete_section = {
			id: sectionId,
			section_order: sectionOriginOrder
		}

		const update = {
			project_id: projectId,
			move: 0,
			from: fromSectionOrder,
			end: endSectionOrder
		};

		const data = {
			delete_section,
			update
		}

		swal({
			title: `Are you sure you want to delete this section and tasks within?`,
			text: `Once deleted, you will not be able to recover.`,
			buttons: true
		})
		.then(result => {
			if (result) {
				for (let i = fromSectionOrder; i < projectContainer.children.length; i++ ) {
					projectContainer.children[i].removeAttribute("section-order")
					projectContainer.children[i].setAttribute("section-order", i - 1);
				}

				updateOrder("section",data);
				projectContainer.removeChild(targetSection);
				swal("Section and tasks deleted!");
			}
		});
	}
}

// delete task and alter task order of remaining tasks
function removeTask(e) {
	const removeBtn = e.target;
	if (removeBtn.classList.contains("remove-task-icon")) {
		const targetTask = removeBtn.parentNode.parentNode;
		const taskContainer = targetTask.parentNode;
		const sectionId = Number(taskContainer.parentNode.getAttribute("section-id"));

		const taskId = Number(targetTask.id);
		const taskOrder = Number(targetTask.getAttribute("task-order"));
		const fromTaskOrder = taskOrder + 1;
		const endTaskOrder = Number(taskContainer.lastElementChild.getAttribute("task-order"));

		const delete_task = {
			id: taskId,
			task_order: taskOrder,
			section_id: sectionId
		}

		const update = [{
			move: 0,
			section_id: sectionId,
		}];

		if (fromTaskOrder > endTaskOrder) {
			update[0].from = endTaskOrder + 1;
			update[0].end = fromTaskOrder;
		} else {
			update[0].from = fromTaskOrder + 1;
			update[0].end = endTaskOrder;
		}

		const data = {
			delete_task,
			update
		}

		swal({
			title: `Are you sure you want to delete this task?`,
			text: `Once deleted, you will not be able to recover.`,
			buttons: true
		})
		.then(result => {
			if (result) {
				for (let i = fromTaskOrder; i < taskContainer.children.length; i++ ) {
					taskContainer.children[i].removeAttribute("task-order")
					taskContainer.children[i].setAttribute("task-order", i - 1);
				}

				updateOrder("task", data);
				taskContainer.removeChild(targetTask);
				swal("Task deleted!");
			}
		});
	}
}

// send section order update info to back-end
function updateOrder(type, data) {
	fetch(`/api/1.0/${type}/update`, {
		method: 'POST',
		headers: headers,
		body: JSON.stringify(data)
	})
	.then(res => {
		console.log(res.status)
		if (res.status === 200) {
			return res.json();
		} else {
			window.location = `/home.html`;
			return;
		}
	})
	.then(result => {
		console.log(result);
	})
	.catch(error => {
		console.log(error)
	})
}

// async event listener to show task detail
async function showTaskDetailForm(e) {
	const target = e.target;
	const targetTaskId = Number(target.getAttribute("task-id"));
	if (targetTaskId) {
		currentTaskDetailPopUp.style.display = "block";
		const taskDetail = await getSingleTaskDetail(targetTaskId);
		const { name, description, due_date, isComplete } = taskDetail;

		const taskNameSpan = document.getElementsByClassName('current-task-name')[0];
		taskNameSpan.setAttribute('current-task-id', targetTaskId);
		taskNameSpan.addEventListener('click', showEditTaskNameForm);
		taskNameSpan.innerHTML = name;

		const taskIsComplete = document.getElementsByClassName('task-isComplete')[0];
		taskIsComplete.setAttribute('current-task-id', targetTaskId);

		checkingTask(isComplete, taskIsComplete, taskNameSpan);
		taskIsComplete.addEventListener('click', completeFromTaskDetail);

		
		const taskDueDateSpan = document.getElementsByClassName('current-due-date')[0];
		taskDueDateSpan.setAttribute('current-task-id', targetTaskId);
		if (due_date) {
			taskDueDateSpan.innerHTML = due_date;
		} else {
			taskDueDateSpan.innerHTML = `Click to reschedule`;
		}
		taskDueDateSpan.addEventListener('click', showEditDueDateForm);

		const taskDescriptionSpan = document.getElementsByClassName('current-task-description')[0];
		taskDescriptionSpan.setAttribute('current-task-id', targetTaskId)
		if (description) {
			taskDescriptionSpan.innerHTML = description;
		} else {
			taskDescriptionSpan.innerHTML = `Click to add description to task...`;
		}
		taskDescriptionSpan.addEventListener('click', showEditDescriptionForm);
	}
}

// retrieve single task detail from db.
function getSingleTaskDetail(taskId) {
	const id = Number(taskId);
	let taskDetail = fetch(`/api/1.0/task/${id}`)
		.then(res =>  res.json())
		.then(result => result.data[0])
		.catch(error => {
			console.log(error)
		})

	return taskDetail;
}

/*
 Below are functions for editing task detail(name ,description, due_date, isComplete)
*/

// editing task name
// function to replace task title span with form(with input and buttons) 
function showEditTaskNameForm(e) {
	const currentTaskSpan = e.target;
	const currentTaskName = e.target.innerHTML
	currentTaskSpan.style.display = "none";
	const form = document.createElement('form');
	form.classList.add("task-title-form");
	const input = document.createElement('input');
	input.classList.add("rename-task-input")
	input.type = "text";
	input.value = currentTaskName;
	const saveBtn = document.createElement('button');
	saveBtn.classList.add("rename-task-btn", "btn");
	saveBtn.type = "submit";
	saveBtn.innerHTML = "Save";
	saveBtn.addEventListener("click", saveTaskEdit);

	const cancelBtn = document.createElement('button');
	cancelBtn.classList.add("cancel-task-rename-btn", "btn");
	cancelBtn.type = "submit";
	cancelBtn.innerHTML = "Cancel";
	cancelBtn.addEventListener("click", cancelTaskEdit);

	form.append(input, saveBtn, cancelBtn);

	currentTaskSpan.parentNode.append(form)
}

// save task name after edit(task detail跟大綱部分名稱都要改動)
function saveTaskEdit(e) {
	e.preventDefault();
	// 位置與sectionTitle一樣
	const taskTitle = e.target.parentNode.parentNode;
	// same
	const form = e.target.parentNode;
	// same
	const inputBox = e.target.previousSibling;	
	let inputValue = inputBox.value;
	inputValue = inputValue.trim();
	// 位置不太一樣，將previousSibling改為
	const titleSpan = e.target.parentNode.previousElementSibling;

	const taskId = Number(titleSpan.getAttribute("current-task-id"));

	if (!inputValue) {
		swal(`Task name cannot be empty!`);
		return;
	}

	// 對應要改
	taskTitle.removeChild(form);
	titleSpan.innerHTML = inputValue;
	titleSpan.style.display = "block";
	const data = {
		name: inputValue
	};

	editDataById('task', taskId, data);
	const taskNameInSectionContainer = document.querySelectorAll(`[task-id="${taskId}"]`)[1];
	taskNameInSectionContainer.innerHTML = inputValue;
}

// cancel editing task name
function cancelTaskEdit(e) {
	e.preventDefault();
	const form = e.target.parentNode;
	const taskTitle = e.target.parentNode.parentNode;
	const titleSpan = e.target.parentNode.previousElementSibling;
	titleSpan.style.display = "block";
	taskTitle.removeChild(form);
}

// editing task schedule
// function to replace task title span with form(with input and buttons) 
function showEditDueDateForm(e) {
	const currentDateSpan = e.target;
	const currentDateDiv = currentDateSpan.parentNode;
	const currentDateValue = currentDateSpan.innerHTML;
	currentDateSpan.style.display = 'none';

	const form = document.createElement('form');
	form.classList.add("task-date-form");
	const input = document.createElement('input');
	input.classList.add("reschedule-task-input")
	input.type = "date";

	if (currentDateValue === 'Click to reschedule') {
		input.value = '';		
	} else {
		input.value = currentDateValue;		
	}

	const saveBtn = document.createElement('button');
	saveBtn.classList.add("reschedule-task-btn", "btn");
	saveBtn.type = "submit";
	saveBtn.innerHTML = "Save";
	saveBtn.addEventListener("click", saveScheduleEdit);

	const cancelBtn = document.createElement('button');
	cancelBtn.classList.add("cancel-task-reschedule-btn", "btn");
	cancelBtn.type = "submit";
	cancelBtn.innerHTML = "Cancel";
	// 都套用同一個function
	cancelBtn.addEventListener("click", cancelTaskEdit);

	form.append(input, saveBtn, cancelBtn);
	currentDateDiv.append(form);
}

// save task name after edit(task detail跟大綱部分名稱都要改動)
function saveScheduleEdit(e) {
	e.preventDefault();
	// 位置與sectionTitle一樣
	const taskSchedule = e.target.parentNode.parentNode;
	// same
	const form = e.target.parentNode;
	// same
	const inputBox = e.target.previousSibling;	
	let inputValue = inputBox.value;
	inputValue = inputValue.trim();
	// 位置不太一樣，將previousSibling改為
	const scheduleSpan = e.target.parentNode.previousElementSibling;

	const taskId = Number(scheduleSpan.getAttribute("current-task-id"));

	// 對應要改
	taskSchedule.removeChild(form);
	scheduleSpan.innerHTML = inputValue;
	scheduleSpan.style.display = "block";
	const data = {};

	const taskScheduleSpan = document.querySelectorAll(`[current-task-id="${taskId}"]`)[2];
	if (inputValue) {
		data.due_date = inputValue;
		editDataById('task', taskId, data);
		taskScheduleSpan.innerHTML = inputValue;
	} else {
		data.due_date = null;
		editDataById('task', taskId, data);
		taskScheduleSpan.innerHTML = 'Click to reschedule'
	}
}

// editing task description
// function to replace task title span with form(with input and buttons) 
function showEditDescriptionForm(e) {
	const currentDescriptionSpan = e.target;
	const currentDescriptionDiv = currentDescriptionSpan.parentNode;
	const currentDescriptionValue = currentDescriptionSpan.innerHTML;
	currentDescriptionSpan.style.display = 'none';

	const form = document.createElement('form');
	form.classList.add("task-description-form");
	const textarea = document.createElement('textarea');
	textarea.classList.add("description-task-textarea")

	if (currentDescriptionValue === 'Click to add description to task...') {
		textarea.value = '';
		textarea.placeholder = "Type your task description here...";	
	} else {
		textarea.value = currentDescriptionValue;		
	}

	const saveBtn = document.createElement('button');
	saveBtn.classList.add("description-task-btn", "btn");
	saveBtn.type = "submit";
	saveBtn.innerHTML = "Save";
	saveBtn.addEventListener("click", saveDescriptionEdit);

	const cancelBtn = document.createElement('button');
	cancelBtn.classList.add("cancel-task-description-btn", "btn");
	cancelBtn.type = "submit";
	cancelBtn.innerHTML = "Cancel";
	// 都套用同一個function
	cancelBtn.addEventListener("click", cancelTaskEdit);

	form.append(textarea, saveBtn, cancelBtn);
	currentDescriptionDiv.append(form);
}

// save task name after edit(task detail跟大綱部分名稱都要改動)
function saveDescriptionEdit(e) {
	e.preventDefault();
	const originDescription = document.getElementsByClassName('current-task-description')[0].innerHTML;

	// 位置與sectionTitle一樣
	const taskDescription = e.target.parentNode.parentNode;
	// same
	const form = e.target.parentNode;
	// same
	const inputBox = e.target.previousSibling;
	let inputValue = inputBox.value;
	inputValue = inputValue.trim();
	// 位置不太一樣，將previousSibling改為
	const descriptionSpan = e.target.parentNode.previousElementSibling;
	const taskId = Number(descriptionSpan.getAttribute("current-task-id"));

	// 對應要改
	taskDescription.removeChild(form);
	descriptionSpan.innerHTML = inputValue;
	descriptionSpan.style.display = "block";
	const data = {};

	const taskDescriptionSpan = document.querySelectorAll(`[current-task-id="${taskId}"]`)[3];

	if (inputValue.length > 150) {
		swal(`Task description should remain less than 150 characters.`);
		taskDescriptionSpan.innerHTML = originDescription;
		return;
	}

	if (inputValue) {
		data.description = inputValue;
		editDataById('task', taskId, data);
		taskDescriptionSpan.innerHTML = inputValue;
	} else {
		data.description = null;
		editDataById('task', taskId, data);
		taskDescriptionSpan.innerHTML = 'Click to add description to task...';
	}
}

// Complete task at main project container.
function completeTask(e) {
	const checkboxContainer = e.target.parentNode.parentNode;
	const taskNameToCrossOut = checkboxContainer.nextElementSibling.firstElementChild;

	const taskId = Number(taskNameToCrossOut.getAttribute('task-id'));
	const type = 'task';
	const data = {};
	if (taskNameToCrossOut.classList.contains('cross-out')) {
		data.isComplete = 0;
		taskNameToCrossOut.classList.remove('cross-out');
	} else {
		data.isComplete = 1;
		taskNameToCrossOut.classList.add('cross-out');
	}
	editDataById(type, taskId, data);
}

// Complete task at task detail form, need to update task status at both task detail form and project container.
function completeFromTaskDetail(e) {
	const currentNameToCrossOut = e.target.parentNode.parentNode.nextElementSibling.firstElementChild;
	const taskId = Number(currentNameToCrossOut.getAttribute('current-task-id'));
	const type = 'task';
	const data = {};
	const taskNameInSectionContainer = document.querySelectorAll(`[task-id="${taskId}"]`)[1];
	const checkboxInSectionContainer = taskNameInSectionContainer.parentNode.previousElementSibling.lastElementChild.firstElementChild;
	
	if (currentNameToCrossOut.classList.contains('cross-out')) {
		currentNameToCrossOut.classList.remove('cross-out');
		taskNameInSectionContainer.classList.remove('cross-out');
		checkboxInSectionContainer.checked = false;
		data.isComplete = 0;
	} else {
		currentNameToCrossOut.classList.add('cross-out');
		taskNameInSectionContainer.classList.add('cross-out');
		checkboxInSectionContainer.checked = true;
		data.isComplete = 1;
	}
	editDataById(type, taskId, data);
}