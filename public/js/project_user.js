const accessToken = localStorage.getItem('Authorization');
if (!accessToken) {
    window.location = `/home.html`;
}
const headers = {
	'Content-Type': 'application/json',
	'Authorization': accessToken
};

const projectIdQuery = window.location.search;
let projectId = new URLSearchParams(projectIdQuery).get('id');
projectId = Number(projectId);

const userImage = document.getElementById('profile-div').firstElementChild;
const username = document.getElementById('user-name');

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
            const projectList = document.getElementById('project-list');
            for (let i = 0; i < projects.length; i++) {
                const a = document.createElement('a');
                a.href = `?id=${projects[i].id}`;
                const div = document.createElement('div');
                div.innerHTML = projects[i].name;
                a.append(div);
                projectList.appendChild(a);
            }
        }
    })
    .catch(error => {
        console.error(error);
    })
}