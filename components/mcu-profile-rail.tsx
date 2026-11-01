'use client'

import { AlertDialog } from '@base-ui/react/alert-dialog'
import { Dialog } from '@base-ui/react/dialog'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useId, useState } from 'react'
import {
  MAX_PROFILE_NAME_LENGTH,
  MAX_PROFILES,
  PROFILE_AVATARS,
  getAvatar,
  nextAvailableAvatar,
  type ProfileAvatarId,
  type WatchProfile,
} from '@/lib/mcu-profiles'

type MCUProfileRailProps = {
  profiles: WatchProfile[]
  activeProfile: WatchProfile
  onSelect: (id: string) => void
  onCreate: (name: string, avatarId: ProfileAvatarId) => void
  onUpdate: (id: string, name: string, avatarId: ProfileAvatarId) => void
  onDelete: (id: string) => void
}

type EditorMode = 'create' | 'edit'

export function MCUProfileRail({
  profiles,
  activeProfile,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
}: MCUProfileRailProps) {
  const nameFieldId = useId()
  const [editorOpen, setEditorOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [mode, setMode] = useState<EditorMode>('create')
  const [draftName, setDraftName] = useState('')
  const [draftAvatar, setDraftAvatar] = useState<ProfileAvatarId>(PROFILE_AVATARS[0].id)
  const canAdd = profiles.length < MAX_PROFILES
  const canDelete = profiles.length > 1
  const trimmedName = draftName.trim()
  const canSave = trimmedName.length > 0

  useEffect(() => {
    if (!editorOpen) return
    const input = document.getElementById(nameFieldId) as HTMLInputElement | null
    input?.focus()
    input?.select()
  }, [editorOpen, nameFieldId])

  const openCreate = () => {
    if (!canAdd) return
    setMode('create')
    setDraftName('')
    setDraftAvatar(nextAvailableAvatar(profiles))
    setEditorOpen(true)
  }

  const openEdit = () => {
    setMode('edit')
    setDraftName(activeProfile.name)
    setDraftAvatar(activeProfile.avatarId)
    setEditorOpen(true)
  }

  const saveProfile = () => {
    if (!canSave) return
    if (mode === 'create') onCreate(trimmedName, draftAvatar)
    else onUpdate(activeProfile.id, trimmedName, draftAvatar)
    setEditorOpen(false)
  }

  return (
    <section className="profile-rail" aria-label="Watch profiles">
      <div className="profile-rail__copy">
        <p className="profile-rail__kicker">PROFILES</p>
        <p className="profile-rail__name">{activeProfile.name}</p>
      </div>

      <div className="profile-avatar-row">
        {profiles.map((profile) => {
          const avatar = getAvatar(profile.avatarId)
          const isActive = profile.id === activeProfile.id

          return (
            <button
              className={`profile-avatar${isActive ? ' is-active' : ''}`}
              key={profile.id}
              type="button"
              aria-pressed={isActive}
              aria-label={isActive ? `${profile.name}, selected profile` : `Switch to ${profile.name}`}
              onClick={() => onSelect(profile.id)}
            >
              <Image src={avatar.src} alt="" width={112} height={112} />
            </button>
          )
        })}
        {canAdd && (
          <button className="profile-add" type="button" aria-label="Add profile" onClick={openCreate}>
            <Plus size={22} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="profile-rail__actions">
        <button className="profile-action" type="button" onClick={openEdit}>
          <Pencil size={13} aria-hidden="true" /> Edit
        </button>
        {canDelete && (
          <AlertDialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialog.Trigger className="profile-action profile-action--danger" type="button">
              <Trash2 size={13} aria-hidden="true" /> Delete
            </AlertDialog.Trigger>
            <AlertDialog.Portal>
              <AlertDialog.Backdrop className="reset-backdrop" />
              <AlertDialog.Popup className="reset-popup">
                <AlertDialog.Title className="reset-title">Delete this profile?</AlertDialog.Title>
                <AlertDialog.Description className="reset-description">
                  {activeProfile.name}&apos;s watched marks will be cleared from this device.
                </AlertDialog.Description>
                <div className="reset-actions">
                  <AlertDialog.Close className="reset-cancel" type="button">Keep profile</AlertDialog.Close>
                  <AlertDialog.Close className="reset-confirm" type="button" onClick={() => onDelete(activeProfile.id)}>
                    Delete profile
                  </AlertDialog.Close>
                </div>
              </AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        )}
      </div>

      <Dialog.Root open={editorOpen} onOpenChange={setEditorOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="reset-backdrop" />
          <Dialog.Popup className="reset-popup profile-editor">
            <Dialog.Title className="reset-title">
              {mode === 'create' ? 'Add a profile' : 'Edit profile'}
            </Dialog.Title>
            <Dialog.Description className="reset-description">
              {mode === 'create'
                ? `Name this run and pick an avatar. You can keep up to ${MAX_PROFILES} profiles on this device.`
                : 'Change the name or avatar for this run.'}
            </Dialog.Description>

            <form
              className="profile-editor__form"
              onSubmit={(event) => {
                event.preventDefault()
                saveProfile()
              }}
            >
              <label className="profile-editor__label" htmlFor={nameFieldId}>Name</label>
              <input
                id={nameFieldId}
                className="profile-editor__input"
                type="text"
                value={draftName}
                maxLength={MAX_PROFILE_NAME_LENGTH}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Nexus Agent"
                onChange={(event) => setDraftName(event.target.value)}
              />

              <p className="profile-editor__label" id="profile-avatar-label">Avatar</p>
              <div className="profile-picker" role="radiogroup" aria-labelledby="profile-avatar-label">
                {PROFILE_AVATARS.map((avatar) => {
                  const selected = draftAvatar === avatar.id
                  return (
                    <button
                      className={`profile-picker__option${selected ? ' is-selected' : ''}`}
                      key={avatar.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={avatar.label}
                      onClick={() => setDraftAvatar(avatar.id)}
                    >
                      <Image src={avatar.src} alt="" width={96} height={96} />
                    </button>
                  )
                })}
              </div>

              <div className="reset-actions">
                <Dialog.Close className="reset-cancel" type="button">Cancel</Dialog.Close>
                <button className="reset-confirm" type="submit" disabled={!canSave}>
                  {mode === 'create' ? 'Create profile' : 'Save changes'}
                </button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  )
}
