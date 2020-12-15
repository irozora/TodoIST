const accessToken = localStorage.getItem('Authorization');
if (!accessToken) {
    window.location = `/home.html`;
}
const headers = {
	'Content-Type': 'application/json',
	'Authorization': accessToken
};

const userImage = document.getElementById('profile-div').firstElementChild;
const username = document.getElementById('user-name');
const projectFormBtn = document.getElementById('project-form-btn');
const projectPopUp = document.getElementById('project-pop-up');
const projectList = document.getElementById('project-list');

const createProjectBtn = document.getElementById('create-project-btn');

projectFormBtn.addEventListener('click', showProjectForm);
createProjectBtn.addEventListener('click', createProject);

getUserProfile();
getUserProjects();

function getUserProfile() {
    fetch(`/api/1.0/user/profile`, {
		method: 'POST',
		headers: headers,
    })
    .then((res) => res.json())
    .then(result => {
        const userInfo = result.result.user;
        if (!userInfo) {
            window.location = `/404.html`;
        } else {
            userImage.src = userInfo.picture;
            username.innerHTML = userInfo.name;
        }
    })
    .catch(error => {
        console.error(error);
    })
}

function getUserProjects() {
    fetch(`/api/1.0/project/list`, {
		method: 'POST',
		headers: headers,
    })
    .then((res) => res.json())
    .then(result => {
        if (result.error) {
            window.location = `/404.html`;
        } else {
            const { projects } = result;
            if (projects.length) {
                for (let i = 0; i < projects.length; i++) {
                    const projectElement = createProjectElement(projects[i].name, projects[i].id)
                    projectList.appendChild(projectElement);
                }
            }
        }
    })
    .catch(error => {
        console.error(error);
    })
}

function showProjectForm(e) {
	if (e.target.classList.contains('project-form-btn')) {
		projectPopUp.style.display = "block";
	}
}

async function createProject(e) {
    e.preventDefault();

    let name = document.getElementById("project-name");
	let projectName = name.value;
    
    if (!projectName.trim()) {
		swal(`Project name is required!`);
		return;
	}

    if (projectName.trim().length > 15) {
		swal(`Project name should be less than 15 characters.`);
		return;
	}

	const projectInfo = {
		name: projectName,
	}

    const newProjectId = await getProjectId(projectInfo);
    console.log(newProjectId)
	const projectElement = createProjectElement(projectName, newProjectId);
    projectList.append(projectElement);

	projectPopUp.style.display = "none";
}

function getProjectId (data) {
	let id = fetch(`/api/1.0/project/create`, {
		method: 'POST',
		headers: headers,
		body: JSON.stringify(data)
	})
	.then(res => res.json())
	.then(result => {
        console.log(result.projectId)
		return result.projectId;
	})
	.catch(error => {
		console.log(error)
	})

	return id;
}

function createProjectElement(projectName, projectId) {
    const a = document.createElement('a');
    a.href = `project.html?id=${projectId}`;
    const div = document.createElement('div');
    div.innerHTML = projectName;
    a.append(div);
    return a
}