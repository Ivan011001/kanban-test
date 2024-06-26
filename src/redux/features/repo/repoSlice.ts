import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import { getRepoInfo, getRepoIssues } from "./repoOperations"

import {
  type ColumnState,
  type IIssue,
  type IRepoInfoResponse,
  type IRepoIssuesResponse,
} from "../../../types"

interface IRepoSlice {
  repoUrl: string
  info: {
    ownerUrl: string
    name: string
    owner: string
    stars: number
  }
  issues: {
    todo: IIssue[]
    progress: IIssue[]
    done: IIssue[]
  }
  loading: boolean
  error: string | null
}

const initialState: IRepoSlice = {
  repoUrl: "",
  info: {
    ownerUrl: "",
    name: "",
    owner: "",
    stars: 0,
  },
  issues: {
    todo: [],
    progress: [],
    done: [],
  },
  loading: false,
  error: null,
}

export const repoSlice = createSlice({
  name: "repo",
  initialState,
  reducers: {
    updateIssuePosition(
      state,
      action: PayloadAction<{ column: ColumnState; newIssues: IIssue[] }>,
    ) {
      state.issues[action.payload.column] = action.payload.newIssues

      localStorage.setItem(state.repoUrl, JSON.stringify(state.issues))
    },

    loadIssues(state) {
      if (localStorage.getItem(state.repoUrl)) {
        state.issues = JSON.parse(localStorage.getItem(state.repoUrl)!)
      }
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getRepoInfo.pending, state => {
        state.repoUrl = ""
        state.info = {
          ownerUrl: "",
          name: "",
          owner: "",
          stars: 0,
        }
        state.issues = {
          todo: [],
          progress: [],
          done: [],
        }
        state.loading = true
        state.error = null
      })
      .addCase(
        getRepoInfo.fulfilled,
        (state, action: PayloadAction<IRepoInfoResponse>) => {
          state.loading = false
          state.repoUrl = action.payload.html_url
          state.info = {
            name: action.payload.name,
            owner: action.payload.owner.login,
            stars: action.payload.stargazers_count,
            ownerUrl: action.payload.owner.html_url,
          }
        },
      )
      .addCase(getRepoInfo.rejected, (state, action) => {
        state.repoUrl = ""
        state.info = {
          ownerUrl: "",
          name: "",
          owner: "",
          stars: 0,
        }
        state.issues = {
          todo: [],
          progress: [],
          done: [],
        }
        state.loading = false
        state.error = action.error.message || "Failed to fetch repo information"
      })
      .addCase(getRepoIssues.pending, state => {
        state.repoUrl = ""
        state.info = {
          ownerUrl: "",
          name: "",
          owner: "",
          stars: 0,
        }
        state.issues = {
          todo: [],
          progress: [],
          done: [],
        }
        state.loading = true
        state.error = null
      })
      .addCase(
        getRepoIssues.fulfilled,
        (state, action: PayloadAction<IRepoIssuesResponse>) => {
          state.loading = false

          if (localStorage.getItem(state.repoUrl)) {
            state.issues = JSON.parse(localStorage.getItem(state.repoUrl)!)

            return
          }

          const newIssues = action.payload.map(
            issue =>
              ({
                id: issue.id,
                user: issue.user.login,
                title: issue.title,
                number: issue.number,
                comments: issue.comments,
                openedAt: issue.created_at,
                columnState:
                  issue.state === "open" && !issue.assignee
                    ? "todo"
                    : issue.assignee
                      ? "progress"
                      : "done",
              }) as IIssue,
          )

          state.issues = {
            todo: state.issues.todo.concat(
              newIssues.filter(issue => issue.columnState === "todo"),
            ),
            progress: state.issues.progress.concat(
              newIssues.filter(issue => issue.columnState === "progress"),
            ),
            done: state.issues.done.concat(
              newIssues.filter(issue => issue.columnState === "done"),
            ),
          }

          localStorage.setItem(state.repoUrl, JSON.stringify(state.issues))
        },
      )
      .addCase(getRepoIssues.rejected, (state, action) => {
        state.repoUrl = ""
        state.info = {
          ownerUrl: "",
          name: "",
          owner: "",
          stars: 0,
        }
        state.issues = {
          todo: [],
          progress: [],
          done: [],
        }
        state.loading = false
        state.error = action.error.message || "Failed to fetch repo issues"
      })
  },
})

export const { updateIssuePosition, loadIssues } = repoSlice.actions

export const repoReducer = repoSlice.reducer
